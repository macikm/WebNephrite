import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { callHeliosApi } from "@/lib/helios-api";

function extractHeaders(extra: any): Record<string, string | undefined> {
  return extra?.requestInfo?.headers || {};
}

function jsonText(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorText(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return {
    content: [
      {
        type: "text" as const,
        text: `CHYBA: ${msg}`,
      },
    ],
    isError: true,
  };
}

/**
 * Helper to limit and simplify list results to prevent giant raw JSON dumps in AI chats.
 */
function formatListResult<T>(
  entityName: string,
  list: T[],
  limit = 10,
  cleanFn?: (item: T) => any
) {
  const total = list.length;
  const items = (cleanFn ? list.map(cleanFn) : list).slice(0, limit);
  const result: Record<string, any> = {
    totalCount: total,
    [entityName]: items,
  };
  if (total > limit) {
    result.info = `Zobrazeno prvních ${limit} položek z celkových ${total}. DŮLEŽITÉ PRO ASISTENTA: Nikdy nevypisujte uživateli celý surový JSON. Uveďte celkový počet a stručný lidský přehled v češtině.`;
  }
  return jsonText(result);
}

export function registerHeliosTools(server: McpServer) {
  /* =========================================================
   * 1. FAKTURY VYDANÉ (Invoices Issued)
   * ========================================================= */
  server.tool(
    "helios_list_invoices_issued",
    "Získá seznam vydaných faktur (odběratelských). DŮLEŽITÉ: Nikdy uživateli nevypisujte celý surový JSON, odpovězte stručně a lidsky česky.",
    {
      top: z.number().optional().default(50).describe("Maximální počet záznamů"),
      skip: z.number().optional().default(0).describe("Počet záznamů k přeskočení"),
      unpaidOnly: z.boolean().optional().describe("Filtrovat pouze neuhrazené faktury"),
      customerName: z.string().optional().describe("Filtrovat podle názvu odběratele"),
    },
    async ({ top, skip, unpaidOnly, customerName }, extra) => {
      try {
        const query: Record<string, string | number> = { Top: top, Skip: skip };
        const res = await callHeliosApi<any>("v1/invoices/invoicesIssued", {
          query,
          headers: extractHeaders(extra),
        });

        let list: any[] = res.data?.data || res.data?.invoicesIssued || (Array.isArray(res.data) ? res.data : []);
        if (unpaidOnly) {
          list = list.filter((i) => i.invPaymentStatusCode === "unpaid" || (i.outstandingAmount && i.outstandingAmount > 0));
        }
        if (customerName) {
          const q = customerName.toLowerCase();
          list = list.filter((i) => (i.customer?.name || "").toLowerCase().includes(q));
        }

        return formatListResult("invoices", list, 10, (i) => ({
          id: i.id,
          number: i.number,
          customer: i.customer?.name,
          totalAmount: i.totalAmount,
          outstandingAmount: i.outstandingAmount,
          dueDate: i.dueDate,
          status: i.invPaymentStatusCode,
        }));
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_get_invoice_issued",
    "Získá detail konkrétní vydané faktury včetně položek a odběratele",
    {
      id: z.number().describe("ID vydané faktury"),
    },
    async ({ id }, extra) => {
      try {
        const res = await callHeliosApi(`v1/invoices/invoicesIssued/${id}`, {
          headers: extractHeaders(extra),
        });
        return jsonText(res.data);
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_create_invoice_issued",
    "Vytvoří novou vydanou fakturu v Helios Nephrite",
    {
      number: z.string().describe("Číslo dokladu, např. 'FV2026-0001'"),
      customerId: z.number().optional().describe("ID zákazníka/odběratele z číselníku partnerů"),
      customerName: z.string().describe("Název odběratele"),
      issueDate: z.string().optional().describe("Datum vystavení (YYYY-MM-DD)"),
      dueDate: z.string().optional().describe("Datum splatnosti (YYYY-MM-DD)"),
      totalAmount: z.number().describe("Celková částka faktury"),
      currencyCode: z.string().optional().default("CZK").describe("Měna (CZK, EUR, USD)"),
      paymentType: z.string().optional().default("Převodem").describe("Forma úhrady"),
      note: z.string().optional().describe("Poznámka k faktuře"),
      items: z.array(
        z.object({
          name: z.string().describe("Název položky/služby"),
          quantity: z.number().describe("Množství"),
          unitPrice: z.number().describe("Cena za jednotku bez DPH"),
          vatRate: z.number().optional().default(21).describe("Sazba DPH v % (21, 12, 0)"),
          measureUnit: z.string().optional().default("ks").describe("Měrná jednotka"),
        })
      ).optional().describe("Seznam položek faktury"),
    },
    async (payload, extra) => {
      try {
        const res = await callHeliosApi("v1/invoices/invoicesIssued", {
          method: "POST",
          body: {
            number: payload.number,
            customer: { id: payload.customerId, name: payload.customerName },
            issueDate: payload.issueDate || new Date().toISOString().slice(0, 10),
            dueDate: payload.dueDate,
            totalAmount: payload.totalAmount,
            currencyCode: payload.currencyCode,
            paymentType: payload.paymentType,
            note: payload.note,
            items: payload.items?.map((it) => ({
              name: it.name,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              vatRate: it.vatRate,
              measureUnit: it.measureUnit,
              totalPrice: it.quantity * it.unitPrice,
              totalPriceWithVat: it.quantity * it.unitPrice * (1 + (it.vatRate || 21) / 100),
            })),
          },
          headers: extractHeaders(extra),
        });
        return jsonText({ success: true, message: "Vydaná faktura byla úspěšně vytvořena", data: res.data });
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_update_invoice_issued",
    "Upraví existující vydanou fakturu v Helios Nephrite",
    {
      id: z.number().describe("ID vydané faktury"),
      data: z.record(z.string(), z.any()).describe("Objekt polí pro aktualizaci faktury"),
    },
    async ({ id, data }, extra) => {
      try {
        const res = await callHeliosApi(`v1/invoices/invoicesIssued/${id}`, {
          method: "PUT",
          body: data,
          headers: extractHeaders(extra),
        });
        return jsonText({ success: true, message: `Vydaná faktura #${id} byla upravena`, data: res.data });
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_delete_invoice_issued",
    "Smaže vydanou fakturu podle ID",
    { id: z.number().describe("ID vydané faktury ke smazání") },
    async ({ id }, extra) => {
      try {
        const res = await callHeliosApi(`v1/invoices/invoicesIssued/${id}`, {
          method: "DELETE",
          headers: extractHeaders(extra),
        });
        return jsonText({ success: true, message: `Vydaná faktura #${id} byla smazána`, data: res.data });
      } catch (err) {
        return errorText(err);
      }
    }
  );

  /* =========================================================
   * 2. FAKTURY PŘIJATÉ (Invoices Received)
   * ========================================================= */
  server.tool(
    "helios_list_invoices_received",
    "Získá seznam přijatých faktur (od dodavatelů). DŮLEŽITÉ: Nikdy uživateli nevypisujte celý surový JSON, odpovězte stručně a lidsky česky.",
    {
      top: z.number().optional().default(50).describe("Maximální počet záznamů"),
      skip: z.number().optional().default(0).describe("Počet přeskočených záznamů"),
      unpaidOnly: z.boolean().optional().describe("Filtrovat pouze neuhrazené faktury"),
      supplierName: z.string().optional().describe("Filtrovat podle názvu dodavatele"),
    },
    async ({ top, skip, unpaidOnly, supplierName }, extra) => {
      try {
        const query: Record<string, string | number> = { Top: top, Skip: skip };
        const res = await callHeliosApi<any>("v1/invoices/invoicesReceived", {
          query,
          headers: extractHeaders(extra),
        });

        let list: any[] = res.data?.data || res.data?.invoicesReceived || (Array.isArray(res.data) ? res.data : []);
        if (unpaidOnly) {
          list = list.filter((i) => i.invPaymentStatusCode === "unpaid" || (i.outstandingAmount && i.outstandingAmount > 0));
        }
        if (supplierName) {
          const q = supplierName.toLowerCase();
          list = list.filter((i) => ((i.supplier?.name || i.customer?.name || "") as string).toLowerCase().includes(q));
        }

        return formatListResult("invoices", list, 10, (i) => ({
          id: i.id,
          number: i.number,
          supplier: i.supplier?.name || i.customer?.name,
          totalAmount: i.totalAmount,
          outstandingAmount: i.outstandingAmount,
          dueDate: i.dueDate,
          status: i.invPaymentStatusCode,
        }));
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_get_invoice_received",
    "Získá detail konkrétní přijaté faktury podle ID",
    { id: z.number().describe("ID přijaté faktury") },
    async ({ id }, extra) => {
      try {
        const res = await callHeliosApi(`v1/invoices/invoicesReceived/${id}`, {
          headers: extractHeaders(extra),
        });
        return jsonText(res.data);
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_create_invoice_received",
    "Zaeviduje novou přijatou fakturu od dodavatele",
    {
      number: z.string().describe("Interní číslo dokladu"),
      invoiceNo: z.string().optional().describe("Číslo dokladu od dodavatele"),
      supplierId: z.number().optional().describe("ID dodavatele z číselníku partnerů"),
      supplierName: z.string().describe("Název dodavatele"),
      issueDate: z.string().optional().describe("Datum vystavení"),
      dueDate: z.string().optional().describe("Datum splatnosti"),
      totalAmount: z.number().describe("Částka faktury"),
      variableSymbol: z.string().optional().describe("Variabilní symbol pro platbu"),
      currencyCode: z.string().optional().default("CZK"),
      note: z.string().optional(),
    },
    async (payload, extra) => {
      try {
        const res = await callHeliosApi("v1/invoices/invoicesReceived", {
          method: "POST",
          body: {
            number: payload.number,
            invoiceNo: payload.invoiceNo,
            supplier: { id: payload.supplierId, name: payload.supplierName },
            issueDate: payload.issueDate || new Date().toISOString().slice(0, 10),
            dueDate: payload.dueDate,
            totalAmount: payload.totalAmount,
            variableSymbol: payload.variableSymbol,
            currencyCode: payload.currencyCode,
            note: payload.note,
          },
          headers: extractHeaders(extra),
        });
        return jsonText({ success: true, message: "Přijatá faktura byla zaevidována", data: res.data });
      } catch (err) {
        return errorText(err);
      }
    }
  );

  /* =========================================================
   * 3. OBJEDNÁVKY (Orders - Received & Issued)
   * ========================================================= */
  server.tool(
    "helios_list_orders_received",
    "Získá seznam přijatých objednávek (od zákazníků). DŮLEŽITÉ: Nikdy nevypisujte surový JSON, odpovězte stručným lidským přehledem.",
    {
      top: z.number().optional().default(50),
      skip: z.number().optional().default(0),
    },
    async ({ top, skip }, extra) => {
      try {
        const res = await callHeliosApi<any>("v1/warehouse/ordersReceived", {
          query: { Top: top, Skip: skip },
          headers: extractHeaders(extra),
        });
        const list = res.data?.data || res.data?.ordersReceived || (Array.isArray(res.data) ? res.data : []);
        return formatListResult("orders", list, 10, (o) => ({
          id: o.id,
          orderNumber: o.orderNumber || o.number,
          customer: o.customerName || o.customer?.name,
          totalAmount: o.totalAmount,
          orderDate: o.orderDate,
          status: o.status,
        }));
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_get_order_received",
    "Získá detail přijaté objednávky včetně položek podle ID",
    { id: z.number().describe("ID objednávky") },
    async ({ id }, extra) => {
      try {
        const res = await callHeliosApi(`v1/warehouse/ordersReceived/${id}`, {
          headers: extractHeaders(extra),
        });
        return jsonText(res.data);
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_create_order_received",
    "Vytvoří novou přijatou objednávku od zákazníka",
    {
      orderNumber: z.string().describe("Číslo objednávky"),
      customerName: z.string().describe("Název zákazníka"),
      customerId: z.number().optional().describe("ID zákazníka"),
      orderDate: z.string().optional().describe("Datum objednání"),
      deliveryDate: z.string().optional().describe("Požadovaný termín dodání"),
      totalAmount: z.number().optional().describe("Celková hodnota"),
      note: z.string().optional(),
    },
    async (payload, extra) => {
      try {
        const res = await callHeliosApi("v1/warehouse/ordersReceived", {
          method: "POST",
          body: {
            orderNumber: payload.orderNumber,
            customerName: payload.customerName,
            customer: { id: payload.customerId, name: payload.customerName },
            orderDate: payload.orderDate || new Date().toISOString().slice(0, 10),
            deliveryDate: payload.deliveryDate,
            totalAmount: payload.totalAmount,
            note: payload.note,
          },
          headers: extractHeaders(extra),
        });
        return jsonText({ success: true, message: "Přijatá objednávka byla vytvořena", data: res.data });
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_list_orders_issued",
    "Získá seznam vydaných objednávek (dodavatelům). DŮLEŽITÉ: Nikdy nevypisujte surový JSON, odpovězte stručně.",
    {
      top: z.number().optional().default(50),
      skip: z.number().optional().default(0),
    },
    async ({ top, skip }, extra) => {
      try {
        const res = await callHeliosApi<any>("v1/warehouse/ordersIssued", {
          query: { Top: top, Skip: skip },
          headers: extractHeaders(extra),
        });
        const list = res.data?.data || res.data?.ordersIssued || (Array.isArray(res.data) ? res.data : []);
        return formatListResult("orders", list, 10, (o) => ({
          id: o.id,
          orderNumber: o.orderNumber || o.number,
          totalAmount: o.totalAmount,
          orderDate: o.orderDate,
          status: o.status,
        }));
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_get_order_issued",
    "Získá detail vydané objednávky včetně položek podle ID",
    { id: z.number().describe("ID vydané objednávky") },
    async ({ id }, extra) => {
      try {
        const res = await callHeliosApi(`v1/warehouse/ordersIssued/${id}`, {
          headers: extractHeaders(extra),
        });
        return jsonText(res.data);
      } catch (err) {
        return errorText(err);
      }
    }
  );

  /* =========================================================
   * 4. ZÁKAZNÍCI A PARTNEŘI (Companies / Customers)
   * ========================================================= */
  server.tool(
    "helios_search_customers",
    "Vyhledá partnery/zákazníky/dodavatele v Heliosu podle názvu, IČO nebo DIČ. DŮLEŽITÉ: Nikdy uživateli nevypisujte celý surový JSON. Odpovězte lidsky česky – souhrnným počtem, krátkým shrnutím nebo stručným přehledem.",
    {
      query: z.string().optional().describe("Hledaný text (název firmy, IČO, DIČ, město)"),
      top: z.number().optional().default(50).describe("Maximální počet výsledků"),
    },
    async ({ query, top }, extra) => {
      try {
        // Attempt fast browse 12 first
        let list: any[] = [];
        try {
          const res = await callHeliosApi<any>("v1/Generic/browse/12", {
            query: { Top: top || 100 },
            headers: extractHeaders(extra),
          });
          const raw = res.data?.data || (Array.isArray(res.data) ? res.data : []);
          list = raw.map((o: any) => ({
            id: Number(o.organizace_cislo_subjektu || o.id || 0),
            number: String(o.organizace_reference_subjektu || o.number || o.organizace_cislo_subjektu || ""),
            name: String(o.organizace_nazev_subjektu || o.name || "Neznámá společnost"),
            tin: o.organizace_ico ? String(o.organizace_ico) : undefined,
            vatId: o.organizace_dic ? String(o.organizace_dic) : undefined,
            street: o.organizace_ulice ? String(o.organizace_ulice) : undefined,
            city: o.organizace_misto ? String(o.organizace_misto) : undefined,
            zipCode: o.organizace_psc ? String(o.organizace_psc) : undefined,
            country: o.zeme_iso_kod_zeme ? String(o.zeme_iso_kod_zeme) : "CZ",
          }));
        } catch {
          // Fallback to eshop customers
          const res = await callHeliosApi<any>("v1/eshop/customers", {
            query: { Top: top || 100 },
            headers: extractHeaders(extra),
          });
          list = res.data?.customers || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        }

        if (query) {
          const q = query.toLowerCase().trim();
          list = list.filter(
            (c) =>
              (c.name || "").toLowerCase().includes(q) ||
              (c.tin || "").includes(q) ||
              (c.vatId || "").toLowerCase().includes(q) ||
              (c.city || "").toLowerCase().includes(q)
          );
        }

        return formatListResult("customers", list, 10, (c) => ({
          id: c.id,
          number: c.number,
          name: c.name,
          tin: c.tin,
          city: c.city,
        }));
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_get_customer_detail",
    "Získá kompletní detail partnera / společnosti podle ID",
    { id: z.number().describe("ID partnera/společnosti") },
    async ({ id }, extra) => {
      try {
        const res = await callHeliosApi(`v1/general/companies/${id}`, {
          headers: extractHeaders(extra),
        });
        return jsonText(res.data);
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_create_customer",
    "Založí novou společnost / partnera v číselníku Helios",
    {
      name: z.string().describe("Název společnosti"),
      tin: z.string().optional().describe("IČO"),
      vatId: z.string().optional().describe("DIČ"),
      street: z.string().optional().describe("Ulice a číslo"),
      city: z.string().optional().describe("Město"),
      zipCode: z.string().optional().describe("PSČ"),
      country: z.string().optional().default("CZ").describe("Kód země (CZ, SK)"),
      phone: z.string().optional().describe("Telefon"),
      email: z.string().optional().describe("E-mail"),
      web: z.string().optional().describe("Webová stránka"),
    },
    async (payload, extra) => {
      try {
        const res = await callHeliosApi("v1/general/companies", {
          method: "POST",
          body: payload,
          headers: extractHeaders(extra),
        });
        return jsonText({ success: true, message: `Společnost '${payload.name}' byla vytvořena`, data: res.data });
      } catch (err) {
        return errorText(err);
      }
    }
  );

  /* =========================================================
   * 5. KONTAKTNÍ OSOBY (Contacts)
   * ========================================================= */
  server.tool(
    "helios_list_contacts",
    "Získá seznam kontaktních osob. DŮLEŽITÉ: Nikdy nevypisujte surový JSON, odpovězte stručně a lidsky česky.",
    {
      companyId: z.number().optional().describe("ID společnosti pro filtrování kontaktů"),
      search: z.string().optional().describe("Hledané jméno, příjmení nebo e-mail"),
      top: z.number().optional().default(50),
    },
    async ({ companyId, search, top }, extra) => {
      try {
        const res = await callHeliosApi<any>("v1/general/contacts", {
          query: { Top: top },
          headers: extractHeaders(extra),
        });
        let list: any[] = res.data?.contacts || res.data?.data || (Array.isArray(res.data) ? res.data : []);

        if (companyId) {
          list = list.filter((c) => c.company?.id === companyId);
        }
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(
            (c) =>
              (c.name || "").toLowerCase().includes(q) ||
              (c.firstName || "").toLowerCase().includes(q) ||
              (c.lastName || "").toLowerCase().includes(q) ||
              (c.email || "").toLowerCase().includes(q)
          );
        }

        return formatListResult("contacts", list, 10, (c) => ({
          id: c.id,
          name: c.name,
          company: c.company?.name,
          email: c.email,
          phone: c.phone,
          position: c.position,
        }));
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_create_contact",
    "Vytvoří novou kontaktní osobu a přiřadí ji ke společnosti",
    {
      name: z.string().describe("Celé jméno"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      companyId: z.number().optional().describe("ID společnosti"),
      email: z.string().optional().describe("E-mail"),
      phone: z.string().optional().describe("Telefon"),
      position: z.string().optional().describe("Pracovní pozice"),
      note: z.string().optional(),
    },
    async (payload, extra) => {
      try {
        const res = await callHeliosApi("v1/general/contacts", {
          method: "POST",
          body: {
            name: payload.name,
            firstName: payload.firstName,
            lastName: payload.lastName,
            company: payload.companyId ? { id: payload.companyId } : undefined,
            email: payload.email,
            phone: payload.phone,
            position: payload.position,
            note: payload.note,
          },
          headers: extractHeaders(extra),
        });
        return jsonText({ success: true, message: `Kontakt '${payload.name}' byl vytvořen`, data: res.data });
      } catch (err) {
        return errorText(err);
      }
    }
  );

  /* =========================================================
   * 6. PRODUKTY A SKLAD (Products & Stock)
   * ========================================================= */
  server.tool(
    "helios_list_products",
    "Získá seznam produktů, ceníků a skladových karet. DŮLEŽITÉ: Nikdy nevypisujte surový JSON, odpovězte stručně a lidsky česky.",
    {
      query: z.string().optional().describe("Hledaný název nebo referenční kód"),
      top: z.number().optional().default(50),
    },
    async ({ query, top }, extra) => {
      try {
        let list: any[] = [];
        try {
          const res = await callHeliosApi<any>("v1/eshop/products", {
            query: { Top: top },
            headers: extractHeaders(extra),
          });
          list = res.data?.products || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        } catch {
          const res = await callHeliosApi<any>("v1/general/products", {
            query: { Top: top },
            headers: extractHeaders(extra),
          });
          list = res.data?.products || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        }

        if (query) {
          const q = query.toLowerCase();
          list = list.filter(
            (p) => (p.name || "").toLowerCase().includes(q) || (p.referenceId || "").toLowerCase().includes(q)
          );
        }

        return formatListResult("products", list, 10, (p) => ({
          id: p.id,
          referenceId: p.referenceId,
          name: p.name,
          price: p.price || p.unitPrice,
          measureUnit: p.measureUnit,
        }));
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_get_product_detail",
    "Získá detail konkrétního produktu podle ID",
    { id: z.number().describe("ID produktu") },
    async ({ id }, extra) => {
      try {
        const res = await callHeliosApi(`v1/general/products/${id}`, {
          headers: extractHeaders(extra),
        });
        return jsonText(res.data);
      } catch (err) {
        return errorText(err);
      }
    }
  );

  /* =========================================================
   * 7. ZAKÁZKY (Job Orders)
   * ========================================================= */
  server.tool(
    "helios_list_job_orders",
    "Získá přehled zakázek v Helios Nephrite. DŮLEŽITÉ: Nikdy nevypisujte surový JSON, odpovězte stručně a lidsky česky.",
    {
      top: z.number().optional().default(50),
      skip: z.number().optional().default(0),
      search: z.string().optional().describe("Vyhledat dle čísla zakázky nebo názvu"),
    },
    async ({ top, skip, search }, extra) => {
      try {
        const res = await callHeliosApi<any>("v1/jobOrder/jobOrders", {
          query: { Top: top, Skip: skip },
          headers: extractHeaders(extra),
        });
        let list: any[] = res.data?.jobOrders || res.data?.data || (Array.isArray(res.data) ? res.data : []);

        if (search) {
          const q = search.toLowerCase();
          list = list.filter((j) => (j.number || "").toLowerCase().includes(q) || (j.name || "").toLowerCase().includes(q));
        }

        return formatListResult("jobOrders", list, 10, (j) => ({
          id: j.id,
          number: j.number,
          name: j.name,
          customer: j.customer?.name,
          budget: j.budget,
          status: j.statusCode,
        }));
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_get_job_order_detail",
    "Získá detail konkrétní zakázky včetně položek a kalkulací",
    { id: z.number().describe("ID zakázky") },
    async ({ id }, extra) => {
      try {
        const res = await callHeliosApi(`v1/jobOrder/jobOrders/${id}`, {
          headers: extractHeaders(extra),
        });
        return jsonText(res.data);
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_create_job_order",
    "Vytvoří novou zakázku v systému",
    {
      number: z.string().describe("Číslo zakázky"),
      name: z.string().describe("Název zakázky"),
      customerId: z.number().optional().describe("ID zákazníka"),
      customerName: z.string().optional().describe("Jméno zákazníka"),
      startDate: z.string().optional().describe("Datum zahájení (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("Termín dokončení (YYYY-MM-DD)"),
      budget: z.number().optional().describe("Plánovaný rozpočet"),
      note: z.string().optional().describe("Poznámka"),
    },
    async (payload, extra) => {
      try {
        const res = await callHeliosApi("v1/jobOrder/jobOrders", {
          method: "POST",
          body: {
            number: payload.number,
            name: payload.name,
            customer: payload.customerId ? { id: payload.customerId, name: payload.customerName } : undefined,
            startDate: payload.startDate,
            endDate: payload.endDate,
            budget: payload.budget,
            note: payload.note,
          },
          headers: extractHeaders(extra),
        });
        return jsonText({ success: true, message: `Zakázka #${payload.number} byla vytvořena`, data: res.data });
      } catch (err) {
        return errorText(err);
      }
    }
  );

  /* =========================================================
   * 8. ÚKOLY ZAKÁZEK (Job Tasks)
   * ========================================================= */
  server.tool(
    "helios_list_job_tasks",
    "Získá seznam úkolů vázaných na zakázky. DŮLEŽITÉ: Nikdy nevypisujte surový JSON, odpovězte stručně.",
    {
      jobOrderId: z.number().optional().describe("Filtrovat úkoly konkrétní zakázky"),
      assignedTo: z.string().optional().describe("Filtrovat dle řešitele"),
      top: z.number().optional().default(50),
    },
    async ({ jobOrderId, assignedTo, top }, extra) => {
      try {
        const res = await callHeliosApi<any>("v1/jobOrder/tasks", {
          query: { Top: top },
          headers: extractHeaders(extra),
        });
        let list: any[] = res.data?.tasks || res.data?.data || (Array.isArray(res.data) ? res.data : []);

        if (jobOrderId) {
          list = list.filter((t) => t.jobOrderId === jobOrderId);
        }
        if (assignedTo) {
          const q = assignedTo.toLowerCase();
          list = list.filter((t) => (t.assignedTo || "").toLowerCase().includes(q));
        }

        return formatListResult("tasks", list, 10, (t) => ({
          id: t.id,
          name: t.name,
          assignedTo: t.assignedTo,
          dueDate: t.dueDate,
          plannedHours: t.plannedHours,
        }));
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_create_job_task",
    "Vytvoří nový úkol k zakázce",
    {
      name: z.string().describe("Název úkolu"),
      jobOrderId: z.number().optional().describe("ID související zakázky"),
      plannedHours: z.number().optional().describe("Plánované hodiny"),
      assignedTo: z.string().optional().describe("Přiřazený řešitel"),
      dueDate: z.string().optional().describe("Termín splnění"),
      description: z.string().optional().describe("Popis zadání úkolu"),
    },
    async (payload, extra) => {
      try {
        const res = await callHeliosApi("v1/jobOrder/tasks", {
          method: "POST",
          body: payload,
          headers: extractHeaders(extra),
        });
        return jsonText({ success: true, message: `Úkol '${payload.name}' byl vytvořen`, data: res.data });
      } catch (err) {
        return errorText(err);
      }
    }
  );

  /* =========================================================
   * 9. SPRÁVA DOKUMENTŮ (DMS Documents)
   * ========================================================= */
  server.tool(
    "helios_list_documents",
    "Získá seznam evidovaných dokumentů v DMS (smlouvy, přílohy, skeny). DŮLEŽITÉ: Nikdy nevypisujte surový JSON, odpovězte stručně.",
    {
      query: z.string().optional().describe("Hledaný text v názvu dokumentu"),
      top: z.number().optional().default(50),
    },
    async ({ query, top }, extra) => {
      try {
        let list: any[] = [];
        try {
          const res = await callHeliosApi<any>("v1/Documents/DMSDocuments", {
            query: { Top: top },
            headers: extractHeaders(extra),
          });
          list = res.data?.documents || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        } catch {
          const res = await callHeliosApi<any>("v1/Documents/ExternalDocuments", {
            query: { Top: top },
            headers: extractHeaders(extra),
          });
          list = res.data?.documents || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        }

        if (query) {
          const q = query.toLowerCase();
          list = list.filter((d) => (d.name || "").toLowerCase().includes(q) || (d.fileName || "").toLowerCase().includes(q));
        }

        // Return without heavy base64 payload in list view
        const cleanList = list.map(({ fileContent, ...rest }) => ({
          ...rest,
          hasContent: !!fileContent,
        }));

        return formatListResult("documents", cleanList, 10, (d) => ({
          id: d.id,
          name: d.name,
          fileName: d.fileName,
          fileContentLength: d.fileContentLength,
          createdOn: d.createdOn,
        }));
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_get_document",
    "Získá detail dokumentu z DMS včetně možnosti stáhnout jeho binární obsah (Base64)",
    {
      id: z.number().describe("ID dokumentu v DMS"),
      includeContent: z.boolean().optional().default(false).describe("Zda zahrnout do odpovědi plný Base64 obsah souboru"),
    },
    async ({ id, includeContent }, extra) => {
      try {
        const res = await callHeliosApi<any>(`v1/Documents/DMSDocuments/${id}`, {
          headers: extractHeaders(extra),
        });
        const doc = res.data;
        if (!includeContent && doc?.fileContent) {
          return jsonText({
            ...doc,
            fileContent: `[Obsah souboru ${doc.fileContentLength || "Base64"} bytů - pro stažení zavolejte s includeContent: true]`,
          });
        }
        return jsonText(doc);
      } catch (err) {
        return errorText(err);
      }
    }
  );

  /* =========================================================
   * 10. UNIVERZÁLNÍ A GENERIC DOTAZY (100% pokrytí čehokoliv v Heliosu)
   * ========================================================= */
  server.tool(
    "helios_browse_query",
    "Univerzální dotaz na libovolnou třídu/číselník v Helios Nephrite přes Generic browse (např. 12 = organizace, bankovní účty, sklady, střediska atd.)",
    {
      classId: z.number().describe("Číslo třídy v Heliosu (např. 12 pro organizace)"),
      top: z.number().optional().default(50).describe("Počet záznamů"),
      skip: z.number().optional().default(0).describe("Přeskočit záznamy"),
    },
    async ({ classId, top, skip }, extra) => {
      try {
        const res = await callHeliosApi(`v1/Generic/browse/${classId}`, {
          query: { Top: top, Skip: skip },
          headers: extractHeaders(extra),
        });
        return jsonText(res.data);
      } catch (err) {
        return errorText(err);
      }
    }
  );

  server.tool(
    "helios_raw_api_call",
    "Přímé volání libovolného REST endpointu Helios Nephrite API (umožňuje provést jakoukoliv operaci GET/POST/PUT/DELETE, kterou Helios API nabízí)",
    {
      endpoint: z.string().describe("Cesta endpointu za /api/, např. 'v1/invoices/invoicesIssued' nebo 'v1/system/info'"),
      method: z.enum(["GET", "POST", "PUT", "DELETE"]).optional().default("GET").describe("HTTP metoda"),
      query: z.record(z.string(), z.any()).optional().describe("URL parametry"),
      body: z.any().optional().describe("JSON tělo požadavku pro POST/PUT"),
    },
    async ({ endpoint, method, query, body }, extra) => {
      try {
        const res = await callHeliosApi(endpoint, {
          method,
          query,
          body,
          headers: extractHeaders(extra),
        });
        return jsonText(res.data);
      } catch (err) {
        return errorText(err);
      }
    }
  );

  /* =========================================================
   * 11. DASHBOARD & SYSTÉMOVÝ PŘEHLED
   * ========================================================= */
  server.tool(
    "helios_get_dashboard_summary",
    "Vrátí rychlý manažerský přehled: stav pohledávek a závazků, neuhrazené faktury, počet zakázek. Odpovězte lidsky česky ve stručném přehledu.",
    {},
    async (_, extra) => {
      try {
        const headers = extractHeaders(extra);
        const [issuedRes, receivedRes, jobsRes] = await Promise.allSettled([
          callHeliosApi<any>("v1/invoices/invoicesIssued?Top=250", { headers }),
          callHeliosApi<any>("v1/invoices/invoicesReceived?Top=250", { headers }),
          callHeliosApi<any>("v1/jobOrder/jobOrders?Top=250", { headers }),
        ]);

        const issued = issuedRes.status === "fulfilled" ? issuedRes.value.data?.invoicesIssued || issuedRes.value.data?.data || [] : [];
        const received = receivedRes.status === "fulfilled" ? receivedRes.value.data?.invoicesReceived || receivedRes.value.data?.data || [] : [];
        const jobs = jobsRes.status === "fulfilled" ? jobsRes.value.data?.jobOrders || jobsRes.value.data?.data || [] : [];

        const totalReceivables = issued.reduce((sum: number, i: any) => sum + (Number(i.totalAmount) || 0), 0);
        const outstandingReceivables = issued.reduce((sum: number, i: any) => sum + (Number(i.outstandingAmount) || 0), 0);
        const unpaidIssuedCount = issued.filter((i: any) => i.invPaymentStatusCode === "unpaid" || (i.outstandingAmount && i.outstandingAmount > 0)).length;

        const totalPayables = received.reduce((sum: number, i: any) => sum + (Number(i.totalAmount) || 0), 0);
        const outstandingPayables = received.reduce((sum: number, i: any) => sum + (Number(i.outstandingAmount) || 0), 0);
        const unpaidReceivedCount = received.filter((i: any) => i.invPaymentStatusCode === "unpaid" || (i.outstandingAmount && i.outstandingAmount > 0)).length;

        return jsonText({
          summary: {
            pohledavky: {
              celkem: Math.round(totalReceivables),
              kUhrade: Math.round(outstandingReceivables),
              pocetNeuhrazenych: unpaidIssuedCount,
              celkemFaktur: issued.length,
            },
            zavazky: {
              celkem: Math.round(totalPayables),
              kUhrade: Math.round(outstandingPayables),
              pocetNeuhrazenych: unpaidReceivedCount,
              celkemFaktur: received.length,
            },
            zakazky: {
              pocetAktivnich: jobs.length,
            },
          },
        });
      } catch (err) {
        return errorText(err);
      }
    }
  );
}
