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

  const { name, email, message } = req.body

  if (!name || !email || !message) {
    console.error("❌ Campos incompletos:", req.body)
    return res.status(400).json({ success: false, error: "Missing required fields" })
  }

  const notionToken = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_DATABASE_ID

  // Guardar en Notion
  try {
    console.log("📦 Enviando datos a Notion...")
    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
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

    if (!notionRes.ok) {
      const text = await notionRes.text()
      console.error("❌ Error en Notion:", text)
      return res.status(500).json({ success: false, error: "Notion error" })
    }
    console.log("✅ Notion: fila creada")
  } catch (error) {
    console.error("❌ Catch Notion:", error)
    return res.status(500).json({ success: false, error: "Error al guardar en Notion" })
  }

  // Enviar correos
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  })

  try {
    console.log("📬 Enviando mail al admin...")
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_RECEIVER,
      subject: "Nuevo lead recibido",
      text: `Nombre: ${name}\nEmail: ${email}\nMensaje: ${message}`
    })
    console.log("✅ Mail admin enviado")

    console.log("📨 Enviando mail al usuario...")
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Gracias por tu contacto 🙌",
      text: `Hola ${name},\n\nGracias por escribirnos. Ya recibimos tu mensaje y vamos a contactarte muy pronto.\n\n— El equipo de Abllle`
    })
    console.log("✅ Mail usuario enviado")

    res.status(200).json({ success: true })
  } catch (error) {
    console.error("❌ Error al enviar mails:", error)
    res.status(500).json({ success: false, error: "Error al enviar correos" })
  }
}
