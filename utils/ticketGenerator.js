import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create public/qrcodes folder if it doesn't exist
const qrCodeDir = path.join(__dirname, '../public/qrcodes');

if (!fs.existsSync(qrCodeDir)) {
  fs.mkdirSync(qrCodeDir, { recursive: true });
}

// Generate unique Ticket ID
export const generateTicketId = () => {
  const date = moment().format('YYYYMMDD');
  const random = Math.floor(1000 + Math.random() * 9000);
  const uuid = uuidv4().slice(0, 8).toUpperCase();
  return `TKT-${date}-${random}-${uuid}`;
};

// Generate QR Code and Save to Local Folder
export const generateQRCodeFile = async (ticketData) => {
  try {
    const qrData = JSON.stringify({
      ticket_id: ticketData.ticket_id,
      user_mobile: ticketData.user_mobile,
      user_name: ticketData.user_name,
      visit_date: ticketData.visit_date,
    });

    // Create filename
    const fileName = `${ticketData.ticket_id}.png`;
    const filePath = path.join(qrCodeDir, fileName);

    // Generate and save QR Code to file
    await QRCode.toFile(filePath, qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Return file path for frontend
    const fileUrl = `/public/qrcodes/${fileName}`;
    
    return fileUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR Code: ${error.message}`);
  }
};

// Generate QR Code as Data URL (for backup)
export const generateQRCodeDataUrl = async (ticketData) => {
  try {
    const qrData = JSON.stringify({
      ticket_id: ticketData.ticket_id,
      user_mobile: ticketData.user_mobile,
      user_name: ticketData.user_name,
      visit_date: ticketData.visit_date,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR Code: ${error.message}`);
  }
};