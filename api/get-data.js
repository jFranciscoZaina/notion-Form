export default async function handler(req, res) {
    const NOTION_API_KEY = process.env.NOTION_API_KEY
    const DATABASE_ID = process.env.NOTION_DATABASE_ID

    const url = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${NOTION_API_KEY}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28",
            },
        })

        const data = await response.json()

        const results = data.results.map((page) => {
            return {
                url:
                    page.properties["Fragmento URL"]?.url ??
                    page.properties["Fragmento URL"]?.rich_text?.[0]?.plain_text ??
                    "",
                pass:
                    page.properties["Credencial"]?.rich_text?.[0]?.plain_text ??
                    "",
            }
        })

        console.log("✅ Datos extraídos desde Notion:", results)
        res.status(200).json(results)
    } catch (error) {
        console.error("❌ Error al consultar Notion:", error)
        res.status(500).json({ error: "Error al consultar Notion" })
    }
}
