export const downloadUserCertificate = (attempt, userRecord) => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Configure Name Font - Beautiful Elegant Cursive Font
        ctx.font = '140px "Great Vibes", "Edwardian Script ITC", "Vivaldi", "Snell Roundhand", "Brush Script MT", cursive';
        ctx.fillStyle = '#9e7421'; // Deep elegant gold
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // Center it vertically in the empty space

        // Fallback checks to get the most accurate name based on record, attempt, or local context
        let rawName = attempt?.firstName || '';
        if (userRecord && userRecord.lastName) {
          rawName = `${userRecord.firstName || attempt?.firstName || ''} ${userRecord.lastName}`.trim();
        } else if (attempt?.lastName) {
          rawName = `${attempt.firstName} ${attempt.lastName}`.trim();
        } else if (userRecord && !userRecord.lastName) { 
          // userContext fallback might only pass userRecord which has firstName/lastName
          rawName = `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim();
        }

        // Cursive fonts ONLY look good in Title Case, avoid all-caps!
        const toTitleCase = (str) => {
          return str.toLowerCase().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        };

        const displayName = rawName ? toTitleCase(rawName) : 'Student';

        // Name placement: canvas.height * 0.46 pushes it down beautifully into the center of the gap
        ctx.fillText(displayName, canvas.width / 2, canvas.height * 0.46);

        // Erase the pre-printed "Date : ___/____/2026" at the bottom right using a white box
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(canvas.width * 0.55, canvas.height * 0.95, canvas.width * 0.3, canvas.height * 0.05);

        // Write the dynamic date exactly where the template date used to be. 
        // attempt.date is mostly from AdminDashboard logic, otherwise format new Date
        let dateObj = new Date();
        if (attempt?.timestamp) {
           dateObj = new Date(attempt.timestamp);
        } else if (attempt?.date) {
           // Admin format fallback
           const parsed = new Date(attempt.date);
           if (!isNaN(parsed.getTime())) dateObj = parsed;
        }

        const dateOnly = dateObj.toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        });

        ctx.font = 'bold 24px Georgia, "Times New Roman", serif';
        ctx.fillStyle = '#333333'; // Match the template's dark grey/black font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`Date: ${dateOnly}`, canvas.width * 0.68, canvas.height * 0.985);

        // Trigger Download
        const link = document.createElement('a');
        link.download = `Certificate_${displayName.replace(/[^a-zA-Z0-9_\s]/g, '').replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);

        // Append to body, click, then remove (required by some browsers)
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error("Canvas drawing error:", e);
        alert("Error generating certificate: " + e.message);
      }
    };

    img.onerror = () => {
      alert(`Failed to load the certificate template image.`);
    };

    // Use Vite's BASE_URL to ensure it works on GitHub Pages subpaths
    const basePath = import.meta.env.BASE_URL || '/';
    const cleanBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
    img.src = `${cleanBasePath}certificate of Completion.png`;
  } catch (err) {
    console.error("Certificate generation error:", err);
    alert("An unexpected error occurred while creating the certificate.");
  }
};
