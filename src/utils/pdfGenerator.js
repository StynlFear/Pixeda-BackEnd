import path from 'path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { checkPuppeteerEnvironment, logPuppeteerStatus } from './envCheck.js';

export const generateOrderHTML = (order) => {
  // Calculate totals
  let subtotal = 0;
  order.items.forEach(item => {
    const itemTotal = (item.priceSnapshot || 0) * item.quantity;
    subtotal += itemTotal;
  });
  
  const taxRate = 0.19; // 19% VAT (adjust as needed)
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  // Generate order number
  const orderNumber = order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A';
  
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Purchase Order - ${orderNumber}</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          
          body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
              background: white;
              padding: 40px;
          }
          
          .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
          }
          
          .header-left {
              flex: 1;
          }
          
          .header-right {
              text-align: right;
              flex: 1;
          }
          
          .title {
              font-size: 28px;
              color: #4CAF50;
              font-weight: bold;
              margin-bottom: 20px;
              border-bottom: 3px solid #4CAF50;
              padding-bottom: 10px;
              display: inline-block;
          }
          
          .order-info {
              text-align: right;
              font-size: 11px;
          }
          
          .order-info strong {
              color: #4CAF50;
              display: inline-block;
              width: 80px;
          }
          
          .section {
              margin-bottom: 30px;
          }
          
          .section-header {
              font-weight: bold;
              color: #4CAF50;
              margin-bottom: 10px;
              font-size: 13px;
          }
          
          .two-column {
              display: flex;
              gap: 40px;
              margin-bottom: 30px;
          }
          
          .column {
              flex: 1;
          }
          
          .address-block {
              background: #f9f9f9;
              padding: 15px;
              border-left: 4px solid #4CAF50;
          }
          
          .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              border: 2px solid #4CAF50;
          }
          
          .table th {
              background: #4CAF50;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: bold;
              font-size: 11px;
          }
          
          .table td {
              padding: 10px 8px;
              border-bottom: 1px solid #ddd;
              font-size: 11px;
          }
          
          .table tr:nth-child(even) {
              background: #f9f9f9;
          }
          
          .text-right {
              text-align: right;
          }
          
          .text-center {
              text-align: center;
          }
          
          .totals {
              margin-top: 20px;
              text-align: right;
          }
          
          .totals table {
              margin-left: auto;
              border-collapse: collapse;
              min-width: 300px;
          }
          
          .totals td {
              padding: 8px 15px;
              border-bottom: 1px solid #ddd;
          }
          
          .totals .total-row {
              background: #4CAF50;
              color: white;
              font-weight: bold;
              font-size: 16px;
          }
          
          .totals .total-row td {
              border: 2px solid #4CAF50;
          }
          
          .terms {
              margin-top: 40px;
              padding: 20px;
              background: #f9f9f9;
              border-left: 4px solid #4CAF50;
          }
          
          .terms h3 {
              color: #4CAF50;
              margin-bottom: 10px;
              font-size: 13px;
          }
          
          .terms p {
              margin-bottom: 8px;
              font-size: 11px;
          }
          
          .assignments-section {
              margin-top: 30px;
              page-break-inside: avoid;
          }
          
          .assignments-section h3 {
              color: #4CAF50;
              font-size: 16px;
              margin-bottom: 20px;
              border-bottom: 2px solid #4CAF50;
              padding-bottom: 5px;
          }
          
          .item-assignments {
              margin-bottom: 30px;
              page-break-inside: avoid;
          }
          
          .item-assignments h4 {
              color: #333;
              font-size: 14px;
              margin-bottom: 10px;
              background: #f0f0f0;
              padding: 8px 12px;
              border-left: 4px solid #4CAF50;
          }
          
          .assignments-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              border: 1px solid #ddd;
              font-size: 10px;
          }
          
          .assignments-table th {
              background: #2E7D32;
              color: white;
              padding: 8px 6px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #1B5E20;
          }
          
          .assignments-table td {
              padding: 8px 6px;
              border: 1px solid #ddd;
              vertical-align: top;
          }
          
          .assignments-table .active-assignment {
              background: #E8F5E8;
          }
          
          .assignments-table .completed-assignment {
              background: #F5F5F5;
              opacity: 0.8;
          }
          
          .stage-badge {
              display: inline-block;
              padding: 3px 6px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
          }
          
          .stage-graphics { background: #FF9800; color: white; }
          .stage-printing { background: #2196F3; color: white; }
          .stage-cutting { background: #F44336; color: white; }
          .stage-finishing { background: #9C27B0; color: white; }
          .stage-packing { background: #795548; color: white; }
          .stage-to-do { background: #FFC107; color: #333; }
          .stage-done { background: #4CAF50; color: white; }
          .stage-standby { background: #FF5722; color: white; }
          .stage-cancelled { background: #607D8B; color: white; }
          
          .status-active { background: #4CAF50; color: white; }
          .status-completed { background: #757575; color: white; }
          
          .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
          }
          
          .status-to-do { background: #ffeaa7; color: #2d3436; }
          .status-in-progress { background: #74b9ff; color: white; }
          .status-done { background: #00b894; color: white; }
          .status-cancelled { background: #e17055; color: white; }
          .status-ready { background: #a29bfe; color: white; }
          
          .priority-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
          }
          
          .priority-low { background: #ddd; color: #333; }
          .priority-normal { background: #74b9ff; color: white; }
          .priority-high { background: #fdcb6e; color: #2d3436; }
          .priority-urgent { background: #e17055; color: white; }
      </style>
  </head>
  <body>
      <div class="header">
          <div class="header-left">
              <div class="title">work order</div>
          </div>
          <div class="header-right">
              <div class="order-info">
                  <div><strong>ORDER #</strong> ${orderNumber}</div>
                  <div><strong>ORDER DATE</strong> ${formatDate(order.createdAt)}</div>
                  <div><strong>DUE DATE</strong> ${formatDate(order.dueDate)}</div>
                  <div><strong>STATUS</strong> <span class="status-badge status-${order.status?.toLowerCase().replace('_', '-')}">${order.status || 'N/A'}</span></div>
                  <div><strong>PRIORITY</strong> <span class="priority-badge priority-${order.priority?.toLowerCase()}">${order.priority || 'NORMAL'}</span></div>
              </div>
          </div>
      </div>

      <div class="two-column">
          <div class="column">
              <div class="section-header">CUSTOMER</div>
              <div class="address-block">
                  <strong>${order.customer?.firstName || ''} ${order.customer?.lastName || ''}</strong><br>
                  ${order.customer?.email || ''}<br>
                  ${order.customer?.phone || ''}<br>
                  ${order.customer?.whatsapp ? `WhatsApp: ${order.customer.whatsapp}` : ''}
              </div>
          </div>
          <div class="column">
              <div class="section-header">COMPANY</div>
              <div class="address-block">
                  ${order.customerCompany ? `
                      <strong>${order.customerCompany.name}</strong><br>
                      ${order.customerCompany.cui ? `CUI: ${order.customerCompany.cui}<br>` : ''}
                      ${order.customerCompany.description || ''}
                  ` : 'Personal Order'}
              </div>
          </div>
      </div>

      ${order.description ? `
      <div class="section">
          <div class="section-header">ORDER DESCRIPTION</div>
          <div class="address-block">
              ${order.description}
          </div>
      </div>
      ` : ''}

      <table class="table">
          <thead>
              <tr>
                  <th>QTY</th>
                  <th>DESCRIPTION</th>
                  <th>CURRENT STATUS</th>
                  <th>UNIT PRICE</th>
                  <th>AMOUNT</th>
              </tr>
          </thead>
          <tbody>
              ${order.items?.map((item, index) => {
                  const itemTotal = (item.priceSnapshot || 0) * item.quantity;
                  const activeAssignments = item.assignments?.filter(a => a.isActive) || [];
                  const disabledStages = item.disabledStages || [];
                  
                  return `
                      <tr>
                          <td class="text-center"><strong>${item.quantity}</strong></td>
                          <td>
                              <strong>${item.productNameSnapshot || 'N/A'}</strong>
                              ${item.descriptionSnapshot ? `<br><small><em>${item.descriptionSnapshot}</em></small>` : ''}
                              ${item.textToPrint ? `<br><small><strong>Text to print:</strong> "${item.textToPrint}"</small>` : ''}
                              ${item.editableFilePath ? `<br><small><strong>Editable file:</strong> ${item.editableFilePath}</small>` : ''}
                              ${item.printingFilePath ? `<br><small><strong>Print file:</strong> ${item.printingFilePath}</small>` : ''}
                              ${disabledStages.length > 0 ? `<br><small><strong>Disabled stages:</strong> ${disabledStages.join(', ')}</small>` : ''}
                              ${activeAssignments.length > 0 ? `<br><small><strong>Currently assigned to:</strong> ${activeAssignments.map(a => `${a.assignedTo?.firstName || ''} ${a.assignedTo?.lastName || ''}`.trim()).join(', ')}</small>` : ''}
                          </td>
                          <td class="text-center">
                              <span class="status-badge status-${item.itemStatus?.toLowerCase().replace('_', '-')}">${item.itemStatus || 'TO_DO'}</span>
                              ${activeAssignments.length > 0 ? `<br><small class="stage-badge stage-${activeAssignments[0].stage?.toLowerCase()}">${activeAssignments[0].stage}</small>` : ''}
                          </td>
                          <td class="text-right">${item.priceSnapshot ? `${item.priceSnapshot.toFixed(2)} RON` : 'N/A'}</td>
                          <td class="text-right"><strong>${item.priceSnapshot ? `${itemTotal.toFixed(2)} RON` : 'N/A'}</strong></td>
                      </tr>
                  `;
              }).join('') || '<tr><td colspan="5" class="text-center">No items</td></tr>'}
          </tbody>
      </table>

      <div class="totals">
          <table>
              <tr>
                  <td><strong>Subtotal</strong></td>
                  <td class="text-right">${subtotal.toFixed(2)} RON</td>
              </tr>
              <tr>
                  <td><strong>VAT 19%</strong></td>
                  <td class="text-right">${tax.toFixed(2)} RON</td>
              </tr>
              <tr class="total-row">
                  <td><strong>TOTAL</strong></td>
                  <td class="text-right"><strong>${total.toFixed(2)} RON</strong></td>
              </tr>
          </table>
      </div>

      <div class="terms">
          <h3>ORDER DETAILS</h3>
          <p>Work order received through: <strong>${order.receivedThrough || 'N/A'}</strong></p>
          <p>Order Priority: <strong>${order.priority || 'NORMAL'}</strong></p>
          <p>Order Status: <strong>${order.status || 'TO_DO'}</strong></p>
          <p>Due Date: <strong>${formatDate(order.dueDate)}</strong></p>
          ${order.description ? `<p>Description: <strong>${order.description}</strong></p>` : ''}
      </div>

      ${order.items?.some(item => item.assignments?.length > 0) ? `
      <div class="assignments-section">
          <h3>WORK ASSIGNMENTS</h3>
          ${order.items.map((item, itemIndex) => {
              if (!item.assignments || item.assignments.length === 0) return '';
              return `
                  <div class="item-assignments">
                      <h4>Item ${itemIndex + 1}: ${item.productNameSnapshot}</h4>
                      <table class="assignments-table">
                          <thead>
                              <tr>
                                  <th>Stage</th>
                                  <th>Assigned To</th>
                                  <th>Status</th>
                                  <th>Assigned Date</th>
                                  <th>Started</th>
                                  <th>Completed</th>
                                  <th>Time Spent</th>
                                  <th>Notes</th>
                              </tr>
                          </thead>
                          <tbody>
                              ${item.assignments.map(assignment => `
                                  <tr class="${assignment.isActive ? 'active-assignment' : 'completed-assignment'}">
                                      <td><span class="stage-badge stage-${assignment.stage?.toLowerCase()}">${assignment.stage || 'N/A'}</span></td>
                                      <td><strong>${assignment.assignedTo ? `${assignment.assignedTo.firstName || ''} ${assignment.assignedTo.lastName || ''}`.trim() : 'Unassigned'}</strong></td>
                                      <td><span class="status-badge ${assignment.isActive ? 'status-active' : 'status-completed'}">${assignment.isActive ? 'ACTIVE' : 'COMPLETED'}</span></td>
                                      <td>${assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'}</td>
                                      <td>${assignment.startedAt ? new Date(assignment.startedAt).toLocaleDateString() : '-'}</td>
                                      <td>${assignment.completedAt ? new Date(assignment.completedAt).toLocaleDateString() : '-'}</td>
                                      <td>${assignment.timeSpent ? Math.round(assignment.timeSpent / (1000 * 60 * 60)) + 'h' : '-'}</td>
                                      <td>${assignment.stageNotes || '-'}</td>
                                  </tr>
                              `).join('')}
                          </tbody>
                      </table>
                  </div>
              `;
          }).join('')}
      </div>
      ` : ''}
  </body>
  </html>
  `;
};

export const generateOrderPDF = async (order) => {
  try {
    // Check environment for debugging
    const envInfo = checkPuppeteerEnvironment();
    logPuppeteerStatus('Starting PDF generation', { orderId: order._id });
    
    const html = generateOrderHTML(order);
    
    // Configure Chromium for Koyeb serverless environment
    const isDev = process.env.NODE_ENV === 'development';
    
    // Get the executable path with proper error handling
    let executablePath;
    if (isDev) {
      // In development, use system Chrome/Chromium
      executablePath = undefined;
    } else {
      // In production (Koyeb), use the serverless Chromium
      try {
        executablePath = await chromium.executablePath();
        logPuppeteerStatus('Chromium executable found', { path: executablePath });
      } catch (pathError) {
        logPuppeteerStatus('Failed to get Chromium path', { error: pathError.message });
        throw new Error(`Failed to locate Chromium binary: ${pathError.message}`);
      }
    }
    
    const options = {
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
      timeout: 30000,
    };

    logPuppeteerStatus('Launching browser', { isDev, argsCount: options.args.length, hasExecutablePath: !!executablePath });

    // Launch Puppeteer with serverless Chromium
    const browser = await puppeteer.launch(options);
    
    try {
      logPuppeteerStatus('Browser launched, creating page');
      const page = await browser.newPage();
      
      // Set page timeout for Koyeb environment
      page.setDefaultTimeout(20000);
      page.setDefaultNavigationTimeout(20000);
      
      logPuppeteerStatus('Setting page content');
      // Set content and wait for it to load
      await page.setContent(html, { 
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 15000
      });
      
      logPuppeteerStatus('Generating PDF');
      // Generate PDF with optimized settings for Koyeb
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        timeout: 15000
      });
      
      logPuppeteerStatus('PDF generated successfully', { size: pdfBuffer.length });
      console.log(`PDF generated successfully with Puppeteer on Koyeb, size: ${pdfBuffer.length} bytes`);
      return pdfBuffer;
      
    } finally {
      logPuppeteerStatus('Closing browser');
      // Always close the browser to free memory in serverless environment
      await browser.close();
    }
    
  } catch (error) {
    console.error('Koyeb serverless PDF generation failed:', error);
    
    // Provide more specific error information for debugging
    if (error.message.includes('Could not find Chrome')) {
      throw new Error(`PDF generation failed - Chrome binary not found. This is likely a deployment configuration issue on Koyeb. Error: ${error.message}`);
    } else if (error.message.includes('Protocol error')) {
      throw new Error(`PDF generation failed - Browser protocol error (common in serverless): ${error.message}`);
    } else if (error.message.includes('Navigation timeout')) {
      throw new Error(`PDF generation failed - Page load timeout: ${error.message}`);
    } else if (error.message.includes('Target closed') || error.message.includes('Session closed')) {
      throw new Error(`PDF generation failed - Browser session ended unexpectedly: ${error.message}`);
    } else {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }
};

// Fallback function for debugging - returns HTML instead of PDF if Puppeteer fails
export const generateOrderHTMLFallback = (order) => {
  console.log('Using HTML fallback due to PDF generation failure');
  return generateOrderHTML(order);
};

