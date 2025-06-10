import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Set your SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, company, service, message } = await request.json();
    
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // Email to you (the business owner)
    const emailToOwner = {
      to: 'hello@romatekai.com', // Your business email
      from: 'support@romantechs.com', // Verified sender in SendGrid
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Interested Service:</strong> ${service || 'Not specified'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        
        <hr>
        <p><em>This email was sent from the RomaTek AI contact form.</em></p>
      `,
    };

    // Auto-reply to the customer
    const emailToCustomer = {
      to: email,
      from: 'support@romantechs.com', // Verified sender in SendGrid
      subject: 'Thank you for contacting RomaTek AI Solutions',
      html: `
        <h2>Thank you for your interest!</h2>
        <p>Dear ${firstName},</p>
        
        <p>Thank you for reaching out to RomaTek AI Solutions. We've received your message and will get back to you within 24 hours.</p>
        
        <p><strong>Your message:</strong></p>
        <p style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${message.replace(/\n/g, '<br>')}</p>
        
        <p>Best regards,<br>
        The RomaTek AI Team</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">
        RomaTek AI Solutions<br>
        Email: hello@romatekai.com<br>
        Phone: 484.695.0269
        </p>
      `,
    };

    // Send both emails
    await sgMail.send(emailToOwner);
    await sgMail.send(emailToCustomer);

    return NextResponse.json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
} 