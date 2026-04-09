import json
import os
import uuid
from typing import Any, Dict, Optional

import httpx


class MCPHttpClient:
    def __init__(self):
        self.server_url = os.getenv("MCP_SERVER_URL")
        if not self.server_url:
            raise RuntimeError("Missing MCP_SERVER_URL in environment variables.")

        self.session_id: Optional[str] = None
        self.protocol_version: str = "2024-11-05"

    def _base_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }

        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id

        if self.protocol_version:
            headers["MCP-Protocol-Version"] = self.protocol_version

        return headers

    def _extract_json_from_sse(self, text: str) -> Dict[str, Any]:
        """
        Very small parser for MCP event-stream responses.
        Looks for lines starting with 'data:' and parses the JSON payload.
        """
        for line in text.splitlines():
            if line.startswith("data:"):
                payload = line[len("data:"):].strip()
                if payload:
                    return json.loads(payload)

        raise RuntimeError("Could not parse SSE response from MCP server.")

    async def _post_jsonrpc(
        self,
        payload: Dict[str, Any],
        expect_response: bool = True,
    ) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                self.server_url,
                headers=self._base_headers(),
                json=payload,
            )

        # Capture session ID if server provides one
        session_id = response.headers.get("Mcp-Session-Id")
        if session_id:
            self.session_id = session_id

        if not expect_response:
            if response.status_code not in (200, 202):
                raise RuntimeError(
                    f"MCP notification failed: {response.status_code} {response.text}"
                )
            return None

        if response.status_code >= 400:
            raise RuntimeError(f"MCP request failed: {response.status_code} {response.text}")

        content_type = response.headers.get("content-type", "")

        if "application/json" in content_type:
            return response.json()

        if "text/event-stream" in content_type:
            return self._extract_json_from_sse(response.text)

        raise RuntimeError(f"Unexpected MCP response content-type: {content_type}")

    async def initialize(self) -> None:
        if self.session_id:
            return

        init_payload = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "initialize",
            "params": {
                "protocolVersion": self.protocol_version,
                "capabilities": {},
                "clientInfo": {
                    "name": "skymate-fastapi-bridge",
                    "version": "1.0.0",
                },
            },
        }

        init_response = await self._post_jsonrpc(init_payload, expect_response=True)

        if not init_response:
            raise RuntimeError("Empty initialize response from MCP server.")

        result = init_response.get("result", {})
        negotiated_version = result.get("protocolVersion")
        if negotiated_version:
            self.protocol_version = negotiated_version

        initialized_notification = {
            "jsonrpc": "2.0",
            "method": "notifications/initialized",
            "params": {},
        }

        await self._post_jsonrpc(initialized_notification, expect_response=False)

    async def list_tools(self) -> Any:
        await self.initialize()

        payload = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "tools/list",
            "params": {},
        }

        response = await self._post_jsonrpc(payload, expect_response=True)
        if "error" in response:
            raise RuntimeError(f"MCP tools/list error: {response['error']}")

        return response.get("result", {})

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        await self.initialize()

        payload = {
            "jsonrpc": "2.0",
            "id": str(uuid.uuid4()),
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments,
            },
        }

        response = await self._post_jsonrpc(payload, expect_response=True)

        if not response:
            raise RuntimeError("Empty tools/call response from MCP server.")

        if "error" in response:
            raise RuntimeError(f"MCP tools/call error: {response['error']}")

        result = response.get("result", {})

        # Prefer structured content if available
        structured = result.get("structuredContent")
        if structured is not None:
            return structured

        # Some servers may return plain content blocks
        content = result.get("content")
        if isinstance(content, list) and len(content) > 0:
            text_blocks = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    text_blocks.append(item.get("text", ""))
            if text_blocks:
                return "\n".join(text_blocks)

        return result