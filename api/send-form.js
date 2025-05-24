import nodemailer from "nodemailer"

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" })
  }

  res.setHeader("Access-Control-Allow-Origin", "*")


  // Guardar en Notion
  try {
    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: {
          Nombre: {
            title: [{ text: { content: name } }]
          },
          Email: {
            email: email
          },
          Mensaje: {
            rich_text: [{ text: { content: message } }]
          },
          Date: {
            date: { start: new Date().toISOString() }
          }
        }
      })
    })

    if (!notionResponse.ok) {
      throw new Error(`Notion API error: ${notionResponse.statusText}`)
    }
  } catch (error) {
    console.error("❌ Error en Notion:", error)
    return res.status(500).json({ success: false, error: "Error al guardar en Notion" })
  }

  // Enviar emails
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  })

  const toAdmin = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_RECEIVER,
    subject: "Nuevo lead recibido",
    text: `Nombre: ${name}\nEmail: ${email}\nMensaje: ${message}`
  }

  const toLead = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Gracias por tu contacto 🙌",
    text: `Hola ${name},\n\nGracias por escribirnos. Ya recibimos tu mensaje y vamos a contactarte muy pronto.\n\n— El equipo de Abllle`
  }

  try {
    await transporter.sendMail(toAdmin)
    await transporter.sendMail(toLead)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error("❌ Error al enviar mails:", error)
    res.status(500).json({ success: false, error: "Error al enviar correos" })
  }
}
