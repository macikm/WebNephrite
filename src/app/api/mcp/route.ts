import { NextRequest, NextResponse } from "next/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { registerHeliosTools } from "@/lib/mcp/helios-tools";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Accept, X-Helios-User, X-Helios-Password, X-Helios-Url, X-Helios-DbProfile, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Content-Type",
};

function addCors(response: Response): Response {
  for (const [key, val] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, val);
  }
  return response;
}

function createMcpInstance() {
  const server = new McpServer({
    name: "WebNephrite Helios MCP",
    version: "1.0.0",
  });

  registerHeliosTools(server);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode: straightforward for all HTTP agents
    enableJsonResponse: true, // Supports standard JSON-RPC HTTP responses
  });

  return { server, transport };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  const accept = request.headers.get("accept") || "";

  // If a browser/developer navigates to /api/mcp in browser (non-SSE request), display status & documentation
  if (!accept.includes("text/event-stream")) {
    return NextResponse.json(
      {
        name: "WebNephrite Helios MCP Server",
        status: "active",
        protocol: "Model Context Protocol (Streamable HTTP / SSE)",
        endpoint: "/api/mcp",
        auth: {
          description: "Zadejte přihlašovací údaje k Heliosu v HTTP hlavičkách nebo využijte serverový fallback",
          headers: {
            "X-Helios-User": "Uživatelské jméno v Helios Nephrite",
            "X-Helios-Password": "Heslo v Helios Nephrite",
            "X-Helios-Url": "Volitelné přepsání URL Helios API (výchozí z HELIOS_API_URL)",
          },
        },
        tools: [
          "helios_list_invoices_issued",
          "helios_get_invoice_issued",
          "helios_create_invoice_issued",
          "helios_update_invoice_issued",
          "helios_delete_invoice_issued",
          "helios_list_invoices_received",
          "helios_get_invoice_received",
          "helios_create_invoice_received",
          "helios_list_orders_received",
          "helios_get_order_received",
          "helios_create_order_received",
          "helios_list_orders_issued",
          "helios_get_order_issued",
          "helios_search_customers",
          "helios_get_customer_detail",
          "helios_create_customer",
          "helios_list_contacts",
          "helios_create_contact",
          "helios_list_products",
          "helios_get_product_detail",
          "helios_list_job_orders",
          "helios_get_job_order_detail",
          "helios_create_job_order",
          "helios_list_job_tasks",
          "helios_create_job_task",
          "helios_list_documents",
          "helios_get_document",
          "helios_browse_query",
          "helios_raw_api_call",
          "helios_get_dashboard_summary",
        ],
      },
      { headers: CORS_HEADERS }
    );
  }

  // Standard MCP SSE connection
  const { server, transport } = createMcpInstance();
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  return addCors(response);
}

export async function POST(request: NextRequest) {
  const { server, transport } = createMcpInstance();
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  return addCors(response);
}

export async function DELETE(request: NextRequest) {
  const { server, transport } = createMcpInstance();
  await server.connect(transport);
  const response = await transport.handleRequest(request);
  return addCors(response);
}
