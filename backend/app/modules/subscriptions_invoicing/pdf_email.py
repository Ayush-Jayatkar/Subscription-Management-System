from io import BytesIO
import os,smtplib
from email.message import EmailMessage
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
def invoice_pdf(invoice):
    buf=BytesIO(); doc=SimpleDocTemplate(buf,pagesize=letter); s=getSampleStyleSheet(); rows=[["Description","Qty","Unit price","Discount","Tax","Total"]]
    for x in invoice.lines: rows.append([x.description,str(x.quantity),str(x.unit_price),str(x.discount_amount),str(x.tax_amount),str(x.line_total+x.tax_amount)])
    rows += [["Subtotal","","","","",str(invoice.subtotal)],["Discount","","","","",str(invoice.discount_total)],["Tax","","","","",str(invoice.tax_total)],["Total","","","","",str(invoice.total)],["Paid","","","","",str(invoice.paid_amount)]]
    table=Table(rows,repeatRows=1); table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.lightgrey),("GRID",(0,0),(-1,-1),.4,colors.grey)]))
    doc.build([Paragraph("Invoice "+str(invoice.number or invoice.id),s["Title"]),Paragraph(invoice.customer_name+" &lt;"+invoice.customer_email+"&gt;",s["Normal"]),Paragraph(f"Invoice date: {invoice.invoice_date} | Due: {invoice.due_date}",s["Normal"]),Spacer(1,12),table]); return buf.getvalue()
def send_invoice_email(invoice,pdf):
    host=os.getenv("SMTP_HOST")
    if not host:
        print(f"[EMAIL-DEV] invoice {invoice.number} to {invoice.customer_email}"); return "logged"
    msg=EmailMessage(); msg["Subject"]=f"Invoice {invoice.number}"; msg["From"]=os.getenv("SMTP_FROM","billing@localhost"); msg["To"]=invoice.customer_email; msg.set_content("Please find your invoice attached."); msg.add_attachment(pdf,maintype="application",subtype="pdf",filename=f"{invoice.number}.pdf")
    with smtplib.SMTP(host,int(os.getenv("SMTP_PORT","587"))) as server: server.starttls(); server.login(os.getenv("SMTP_USER",""),os.getenv("SMTP_PASSWORD","")); server.send_message(msg)
    return "sent"
