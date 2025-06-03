// /api/get-redirect-users.js

export default async function handler(req, res) {
    // Permitir CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Only GET allowed" });
    }

    try {
        const notionRes = await fetch("https://api.notion.com/v1/databases/" + process.env.NOTION_DATABASE_ID + "/query", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
        });

        const data = await notionRes.json();

        // Mapear solo username y url
        const entries = data.results.map(page => ({
            username: page.properties?.Username?.rich_text?.[0]?.plain_text || "",
            url: page.properties?.URL?.url || "",
        }));

        res.status(200).json(entries);
    } catch (error) {
        console.error("❌ Error al consultar Notion:", error);
        res.status(500).json({ error: "Error al consultar Notion" });
    }
}
