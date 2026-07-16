import fs from "fs";
import path from "path";

const mockupsDir = fs.existsSync(path.join(process.cwd(), "public/mockups"))
  ? path.join(process.cwd(), "public/mockups")
  : path.join(process.cwd(), "backendServer/public/mockups");

if (!fs.existsSync(mockupsDir)) {
  console.error("Mockups directory not found at " + mockupsDir);
  process.exit(1);
}

const files = fs.readdirSync(mockupsDir).filter(f => f.endsWith(".svg"));
console.log(`Found ${files.length} mockup SVG files. Redesigning them...`);

// Helper to escape XML strings
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Generate beautiful premium SVG content based on challenge name/slug
function generateBeautifulSvg(filename) {
  const slug = filename.replace(".svg", "");
  const name = slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const width = 800;
  const height = 600;

  // Base definitions shared by all mockups (gradients, shadows, styles)
  const defs = `
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#0D9488" />
    </linearGradient>
    <linearGradient id="dangerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="100%" stop-color="#DC2626" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1F2937" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#111827" stop-opacity="0.9" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#6366F1" flood-opacity="0.4"/>
    </filter>
  </defs>
  <style>
    .title { font-family: system-ui, -apple-system, sans-serif; font-weight: 700; fill: #F9FAFB; }
    .subtitle { font-family: system-ui, -apple-system, sans-serif; font-weight: 500; fill: #9CA3AF; }
    .body { font-family: system-ui, -apple-system, sans-serif; font-weight: 400; fill: #D1D5DB; }
    .accent { font-family: system-ui, -apple-system, sans-serif; font-weight: 600; fill: #818CF8; }
    .btn-text { font-family: system-ui, -apple-system, sans-serif; font-weight: 600; fill: #FFFFFF; text-anchor: middle; }
    .label { font-family: system-ui, -apple-system, sans-serif; font-weight: 500; fill: #9CA3AF; font-size: 12px; }
  </style>
  `;

  // Draw background frame
  const bgFrame = `
  <!-- Background Frame -->
  <rect width="${width}" height="${height}" rx="16" fill="url(#bgGrad)" stroke="#1F2937" stroke-width="2"/>
  <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="14" fill="none" stroke="#374151" stroke-width="1" opacity="0.3"/>
  
  <!-- Window Header Bar (Mac style) -->
  <circle cx="24" cy="24" r="6" fill="#EF4444"/>
  <circle cx="44" cy="24" r="6" fill="#F59E0B"/>
  <circle cx="64" cy="24" r="6" fill="#10B981"/>
  
  <text x="400" y="28" class="subtitle" font-size="13" text-anchor="middle" letter-spacing="0.5">${escapeXml(name)}</text>
  <line x1="16" y1="48" x2="${width - 16}" y2="48" stroke="#1F2937" stroke-width="1"/>
  `;

  let content = "";

  // 1. DASHBOARDS & ANALYTICS
  if (slug.includes("dashboard") || slug.includes("analytics") || slug.includes("stats") || slug.includes("cms")) {
    content = `
    <!-- Sidebar -->
    <rect x="16" y="64" width="180" height="520" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
    <text x="36" y="100" class="title" font-size="16">DevArena Admin</text>
    <rect x="28" y="120" width="156" height="36" rx="8" fill="#1F2937" opacity="0.5"/>
    <rect x="30" y="122" width="4" height="32" rx="2" fill="#6366F1"/>
    <text x="48" y="142" class="accent" font-size="13">Dashboard</text>
    
    <text x="48" y="186" class="subtitle" font-size="13">Users List</text>
    <text x="48" y="226" class="subtitle" font-size="13">Ladders</text>
    <text x="48" y="266" class="subtitle" font-size="13">Reports</text>
    <text x="48" y="306" class="subtitle" font-size="13">API Keys</text>
    
    <!-- Main Content Area -->
    <g transform="translate(212, 64)">
      <!-- Welcome Header -->
      <text x="0" y="24" class="title" font-size="22">Analytics Overview</text>
      <text x="0" y="44" class="subtitle" font-size="13">Real-time system telemetry and metric logging</text>
      
      <!-- Metric Cards (3 Column Grid) -->
      <!-- Card 1 -->
      <g transform="translate(0, 70)" filter="url(#shadow)">
        <rect width="176" height="100" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
        <text x="16" y="28" class="label">API LATENCY</text>
        <text x="16" y="60" class="title" font-size="24">12.4 ms</text>
        <text x="16" y="82" class="body" font-size="11" fill="#10B981">↑ 2.4% vs last hr</text>
      </g>
      
      <!-- Card 2 -->
      <g transform="translate(192, 70)" filter="url(#shadow)">
        <rect width="176" height="100" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
        <text x="16" y="28" class="label">DB LOAD</text>
        <text x="16" y="60" class="title" font-size="24">1 ms</text>
        <text x="16" y="82" class="body" font-size="11" fill="#10B981">Stable (Optimal)</text>
      </g>
      
      <!-- Card 3 -->
      <g transform="translate(384, 70)" filter="url(#shadow)">
        <rect width="188" height="100" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
        <text x="16" y="28" class="label">ACTIVE SESSIONS</text>
        <text x="16" y="60" class="title" font-size="24">1,482</text>
        <text x="16" y="82" class="body" font-size="11" fill="#8B5CF6">Peak load hours</text>
      </g>
      
      <!-- Large Chart Block -->
      <g transform="translate(0, 190)" filter="url(#shadow)">
        <rect width="572" height="330" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
        <text x="20" y="32" class="title" font-size="15">Response Latency Trend (24h)</text>
        
        <!-- Y Axis Guidelines -->
        <line x1="60" y1="70" x2="532" y2="70" stroke="#1F2937" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="60" y1="130" x2="532" y2="130" stroke="#1F2937" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="60" y1="190" x2="532" y2="190" stroke="#1F2937" stroke-width="1" stroke-dasharray="4 4"/>
        <line x1="60" y1="250" x2="532" y2="250" stroke="#1F2937" stroke-width="1"/>
        
        <!-- Axis labels -->
        <text x="50" y="74" class="label" text-anchor="end">100 ms</text>
        <text x="50" y="134" class="label" text-anchor="end">50 ms</text>
        <text x="50" y="194" class="label" text-anchor="end">25 ms</text>
        <text x="50" y="254" class="label" text-anchor="end">0 ms</text>
        
        <!-- X Axis labels -->
        <text x="100" y="276" class="label" text-anchor="middle">00:00</text>
        <text x="180" y="276" class="label" text-anchor="middle">04:00</text>
        <text x="260" y="276" class="label" text-anchor="middle">08:00</text>
        <text x="340" y="276" class="label" text-anchor="middle">12:00</text>
        <text x="420" y="276" class="label" text-anchor="middle">16:00</text>
        <text x="500" y="276" class="label" text-anchor="middle">20:00</text>
        
        <!-- Chart Curve (Glow Line & Area fill) -->
        <path d="M 100,230 Q 140,210 180,110 T 260,190 T 340,160 T 420,80 T 500,210 L 500,250 L 100,250 Z" fill="url(#primaryGrad)" fill-opacity="0.15"/>
        <path d="M 100,230 Q 140,210 180,110 T 260,190 T 340,160 T 420,80 T 500,210" fill="none" stroke="url(#primaryGrad)" stroke-width="3" filter="url(#glow)"/>
        
        <circle cx="420" cy="80" r="5" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="2"/>
        <rect x="400" y="35" width="80" height="30" rx="6" fill="#111827" stroke="#374151" stroke-width="1"/>
        <text x="440" y="54" class="btn-text" font-size="11">82.1 ms</text>
      </g>
    </g>
    `;
  }
  // 2. CHAT & MESSAGING
  else if (slug.includes("chat") || slug.includes("message") || slug.includes("communication")) {
    content = `
    <!-- Sidebar Contacts List -->
    <rect x="16" y="64" width="220" height="520" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
    <text x="32" y="96" class="title" font-size="17">Messages</text>
    
    <!-- Search Contact -->
    <rect x="32" y="112" width="188" height="32" rx="8" fill="#111827" stroke="#374151" stroke-width="1"/>
    <text x="44" y="132" class="subtitle" font-size="12">Search contacts...</text>
    
    <!-- Contact 1 (Selected) -->
    <g transform="translate(24, 156)">
      <rect width="204" height="60" rx="8" fill="#1F2937" opacity="0.6"/>
      <circle cx="34" cy="30" r="18" fill="url(#primaryGrad)"/>
      <text x="34" y="34" class="btn-text" font-size="14">JD</text>
      <text x="62" y="28" class="title" font-size="13">John Doe</text>
      <text x="62" y="44" class="subtitle" font-size="11">Typing indicator...</text>
      <circle cx="190" cy="30" r="4" fill="#06B6D4"/>
    </g>
    
    <!-- Contact 2 -->
    <g transform="translate(24, 224)">
      <circle cx="34" cy="30" r="18" fill="#374151"/>
      <text x="34" y="34" class="btn-text" font-size="14">AS</text>
      <text x="62" y="28" class="title" font-size="13">Alice Smith</text>
      <text x="62" y="44" class="subtitle" font-size="11">Yeah, see you tomorrow!</text>
    </g>
    
    <!-- Contact 3 -->
    <g transform="translate(24, 292)">
      <circle cx="34" cy="30" r="18" fill="#0D9488"/>
      <text x="34" y="34" class="btn-text" font-size="14">MB</text>
      <text x="62" y="28" class="title" font-size="13">Mike Brown</text>
      <text x="62" y="44" class="subtitle" font-size="11">Let's fix that bug now.</text>
    </g>
    
    <!-- Chat Area -->
    <g transform="translate(252, 64)">
      <rect width="532" height="520" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
      
      <!-- Top Chat Header -->
      <circle cx="36" cy="36" r="18" fill="url(#primaryGrad)"/>
      <text x="36" y="40" class="btn-text" font-size="14">JD</text>
      <text x="64" y="32" class="title" font-size="14">John Doe</text>
      <text x="64" y="48" class="subtitle" font-size="11" fill="#10B981">● Online</text>
      <line x1="16" y1="64" x2="516" y2="64" stroke="#1F2937" stroke-width="1"/>
      
      <!-- Message Bubbles -->
      <!-- Message 1 (Received) -->
      <g transform="translate(16, 88)">
        <rect width="320" height="64" rx="12" fill="#1F2937" stroke="#374151" stroke-width="1"/>
        <text x="16" y="28" class="body" font-size="13">Hey, did you look at the new API mockups?</text>
        <text x="16" y="48" class="label" font-size="10">10:24 AM</text>
      </g>
      
      <!-- Message 2 (Sent) -->
      <g transform="translate(196, 168)">
        <rect width="320" height="64" rx="12" fill="#4338CA" stroke="#6366F1" stroke-width="1"/>
        <text x="16" y="28" class="btn-text" font-size="13" text-anchor="start">Yes, I just generated them! They look super glassy.</text>
        <text x="16" y="48" class="btn-text" font-size="10" text-anchor="start" opacity="0.6">10:25 AM</text>
      </g>
      
      <!-- Message 3 (Received - Typing) -->
      <g transform="translate(16, 248)">
        <rect width="120" height="40" rx="12" fill="#1F2937" stroke="#374151" stroke-width="1"/>
        <circle cx="36" cy="20" r="4" fill="#9CA3AF"/>
        <circle cx="52" cy="20" r="4" fill="#9CA3AF"/>
        <circle cx="68" cy="20" r="4" fill="#9CA3AF"/>
      </g>
      
      <!-- Input Area -->
      <line x1="16" y1="440" x2="516" y2="440" stroke="#1F2937" stroke-width="1"/>
      <rect x="16" y="456" width="420" height="48" rx="24" fill="#111827" stroke="#374151" stroke-width="1.5"/>
      <text x="36" y="485" class="subtitle" font-size="13">Type a message...</text>
      
      <!-- Send Button -->
      <g transform="translate(452, 456)" filter="url(#shadow)">
        <circle cx="24" cy="24" r="24" fill="url(#primaryGrad)"/>
        <path d="M16 24L22 18L32 24L22 30Z" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>
      </g>
    </g>
    `;
  }
  // 3. ACCORDIONS, TABS & TREE VIEWS
  else if (slug.includes("accordion") || slug.includes("tabs") || slug.includes("tree") || slug.includes("menu")) {
    content = `
    <!-- Header Nav tab component -->
    <g transform="translate(80, 80)">
      <rect width="640" height="48" rx="8" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1"/>
      <rect x="4" y="4" width="150" height="40" rx="6" fill="#6366F1"/>
      <text x="79" y="28" class="btn-text" font-size="14">Active Tab</text>
      
      <text x="240" y="28" class="subtitle" font-size="14">Second Tab</text>
      <text x="400" y="28" class="subtitle" font-size="14">Third Option</text>
      <text x="560" y="28" class="subtitle" font-size="14">Disabled Tab</text>
    </g>
    
    <!-- Accordion Card List -->
    <g transform="translate(80, 160)" filter="url(#shadow)">
      <rect width="640" height="380" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
      
      <!-- Item 1 (Expanded) -->
      <g transform="translate(20, 20)">
        <rect width="600" height="50" rx="8" fill="#1F2937" stroke="#374151" stroke-width="1"/>
        <text x="20" y="30" class="title" font-size="14">1. How do I upgrade my role to Admin/Owner?</text>
        <path d="M560 20L570 30L580 20" fill="none" stroke="#F9FAFB" stroke-width="2"/>
        
        <!-- Expanded Body content -->
        <rect x="0" y="60" width="600" height="90" rx="8" fill="#111827" stroke="#1F2937" stroke-width="1"/>
        <text x="20" y="88" class="body" font-size="13">You can use the docker-compose exec command to invoke MongoDB shell</text>
        <text x="20" y="112" class="body" font-size="13">inside the container, then run updateOne on the users collection to set</text>
        <text x="20" y="136" class="accent" font-size="13">role: "OWNER".</text>
      </g>
      
      <!-- Item 2 (Collapsed) -->
      <g transform="translate(20, 190)">
        <rect width="600" height="50" rx="8" fill="#1F2937" stroke="#1F2937" stroke-width="1"/>
        <text x="20" y="30" class="subtitle" font-size="14">2. Is Judge0 required for running backend challenges?</text>
        <path d="M560 30L570 20L580 30" fill="none" stroke="#9CA3AF" stroke-width="2"/>
      </g>
      
      <!-- Item 3 (Collapsed) -->
      <g transform="translate(20, 260)">
        <rect width="600" height="50" rx="8" fill="#1F2937" stroke="#1F2937" stroke-width="1"/>
        <text x="20" y="30" class="subtitle" font-size="14">3. Can I clear the local browser DNS cache?</text>
        <path d="M560 30L570 20L580 30" fill="none" stroke="#9CA3AF" stroke-width="2"/>
      </g>
    </g>
    `;
  }
  // 4. FORMS & INPUTS
  else if (slug.includes("form") || slug.includes("input") || slug.includes("login") || slug.includes("signup") || slug.includes("auth")) {
    content = `
    <!-- Centered Form Card -->
    <g transform="translate(180, 80)" filter="url(#shadow)">
      <rect width="440" height="470" rx="16" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="2"/>
      
      <!-- Header -->
      <text x="220" y="50" class="title" font-size="22" text-anchor="middle">Verify Account</text>
      <text x="220" y="74" class="subtitle" font-size="12" text-anchor="middle">Enter verification details to activate the profile</text>
      
      <!-- Input Group 1 -->
      <g transform="translate(40, 110)">
        <text x="0" y="16" class="title" font-size="13">Email Address</text>
        <rect x="0" y="28" width="360" height="44" rx="8" fill="#111827" stroke="#374151" stroke-width="1.5"/>
        <text x="16" y="54" class="body" font-size="13">umangsisodia2006@gmail.com</text>
      </g>
      
      <!-- Input Group 2 (Focused State) -->
      <g transform="translate(40, 200)">
        <text x="0" y="16" class="accent" font-size="13">6-Digit OTP Code</text>
        <rect x="0" y="28" width="360" height="44" rx="8" fill="#111827" stroke="#6366F1" stroke-width="2" filter="url(#glow)"/>
        <text x="16" y="54" class="title" font-size="15" letter-spacing="4">849 204</text>
        
        <circle cx="340" cy="50" r="6" fill="#10B981"/> <!-- Valid Check -->
      </g>
      
      <!-- Toggle / Helper link -->
      <g transform="translate(40, 290)">
        <text x="0" y="16" class="subtitle" font-size="12">Didn't get code?</text>
        <text x="100" y="16" class="accent" font-size="12" text-decoration="underline">Resend code</text>
      </g>
      
      <!-- Buttons -->
      <g transform="translate(40, 330)">
        <rect width="360" height="48" rx="8" fill="url(#primaryGrad)"/>
        <text x="180" y="28" class="btn-text" font-size="14">Activate Account</text>
      </g>
      
      <g transform="translate(40, 394)">
        <rect width="360" height="48" rx="8" fill="none" stroke="#374151" stroke-width="1.5"/>
        <text x="180" y="28" class="subtitle" font-size="14" text-anchor="middle">Cancel</text>
      </g>
    </g>
    `;
  }
  // 5. E-COMMERCE & PRODUCT GRIDS
  else if (slug.includes("ecommerce") || slug.includes("product") || slug.includes("cart") || slug.includes("pricing")) {
    content = `
    <!-- Top Shopping Nav Header -->
    <g transform="translate(40, 64)">
      <rect width="720" height="50" rx="8" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1"/>
      <text x="24" y="30" class="title" font-size="16">DevArena Store</text>
      
      <g transform="translate(620, 10)">
        <rect width="80" height="30" rx="15" fill="#4F46E5"/>
        <text x="40" y="19" class="btn-text" font-size="11">Cart (2)</text>
      </g>
    </g>
    
    <!-- Grid of Products (2 Cards) -->
    <!-- Card 1 -->
    <g transform="translate(40, 134)" filter="url(#shadow)">
      <rect width="340" height="430" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
      <rect x="16" y="16" width="308" height="200" rx="8" fill="#1F2937" opacity="0.6"/>
      <text x="170" y="120" class="subtitle" font-size="14" text-anchor="middle">Product Mock Image</text>
      
      <text x="16" y="246" class="title" font-size="16">Mechanical Keyboard Pro</text>
      <text x="16" y="268" class="subtitle" font-size="12">Hot-swappable tactile key switches</text>
      
      <!-- Rating stars -->
      <text x="16" y="296" fill="#F59E0B" font-size="14">★★★★★</text>
      <text x="96" y="295" class="label">(48 reviews)</text>
      
      <text x="16" y="340" class="title" font-size="22">$129.99</text>
      
      <!-- Buy Button -->
      <g transform="translate(16, 366)">
        <rect width="308" height="42" rx="8" fill="url(#primaryGrad)"/>
        <text x="154" y="25" class="btn-text" font-size="13">Add to Cart</text>
      </g>
    </g>
    
    <!-- Card 2 -->
    <g transform="translate(420, 134)" filter="url(#shadow)">
      <rect width="340" height="430" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
      <rect x="16" y="16" width="308" height="200" rx="8" fill="#1F2937" opacity="0.6"/>
      <text x="170" y="120" class="subtitle" font-size="14" text-anchor="middle">Product Mock Image</text>
      
      <text x="16" y="246" class="title" font-size="16">Wireless Gaming Mouse</text>
      <text x="16" y="268" class="subtitle" font-size="12">Superlight 26K DPI optical sensor</text>
      
      <!-- Rating stars -->
      <text x="16" y="296" fill="#F59E0B" font-size="14">★★★★☆</text>
      <text x="96" y="295" class="label">(32 reviews)</text>
      
      <text x="16" y="340" class="title" font-size="22">$79.99</text>
      
      <!-- Buy Button -->
      <g transform="translate(16, 366)">
        <rect width="308" height="42" rx="8" fill="url(#primaryGrad)"/>
        <text x="154" y="25" class="btn-text" font-size="13">Add to Cart</text>
      </g>
    </g>
    `;
  }
  // 6. GENERAL EXCEL / TABLES / SELECTS / ACCESSIBILITY
  else {
    content = `
    <!-- Top Nav Header -->
    <g transform="translate(40, 80)">
      <rect width="720" height="50" rx="8" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1"/>
      <text x="24" y="30" class="title" font-size="15">${escapeXml(name)} Wireframe</text>
      
      <g transform="translate(600, 10)">
        <rect width="100" height="30" rx="6" fill="#10B981"/>
        <text x="50" y="19" class="btn-text" font-size="11">Status: OK</text>
      </g>
    </g>
    
    <!-- Table Layout -->
    <g transform="translate(40, 160)" filter="url(#shadow)">
      <rect width="720" height="360" rx="12" fill="url(#cardGrad)" stroke="#1F2937" stroke-width="1.5"/>
      
      <!-- Table Headers -->
      <rect x="0" y="0" width="720" height="48" rx="12" fill="#1F2937" opacity="0.5"/>
      <text x="32" y="30" class="accent" font-size="13">CHALLENGE</text>
      <text x="300" y="30" class="accent" font-size="13">CATEGORY</text>
      <text x="480" y="30" class="accent" font-size="13">DIFFICULTY</text>
      <text x="620" y="30" class="accent" font-size="13">ACTIONS</text>
      <line x1="0" y1="48" x2="720" y2="48" stroke="#1F2937" stroke-width="1.5"/>
      
      <!-- Row 1 -->
      <g transform="translate(0, 48)">
        <text x="32" y="36" class="title" font-size="13">${escapeXml(name.split(" ").slice(0, 3).join(" "))}</text>
        <text x="300" y="36" class="body" font-size="13">UI Component</text>
        <rect x="480" y="16" width="70" height="24" rx="12" fill="#059669" fill-opacity="0.2" stroke="#10B981" stroke-width="1"/>
        <text x="515" y="32" class="btn-text" font-size="11" fill="#10B981" text-anchor="middle">Easy</text>
        <text x="620" y="36" class="accent" font-size="13" text-decoration="underline">Run Challenge</text>
        <line x1="0" y1="60" x2="720" y2="60" stroke="#1F2937" stroke-width="1"/>
      </g>
      
      <!-- Row 2 -->
      <g transform="translate(0, 108)">
        <text x="32" y="36" class="title" font-size="13">Accessible Dropdown Menu Component</text>
        <text x="300" y="36" class="body" font-size="13">Accessibility</text>
        <rect x="480" y="16" width="70" height="24" rx="12" fill="#D97706" fill-opacity="0.2" stroke="#F59E0B" stroke-width="1"/>
        <text x="515" y="32" class="btn-text" font-size="11" fill="#F59E0B" text-anchor="middle">Medium</text>
        <text x="620" y="36" class="accent" font-size="13" text-decoration="underline">Run Challenge</text>
        <line x1="0" y1="60" x2="720" y2="60" stroke="#1F2937" stroke-width="1"/>
      </g>
      
      <!-- Row 3 -->
      <g transform="translate(0, 168)">
        <text x="32" y="36" class="title" font-size="13">Advanced Analytics Dashboard Playground</text>
        <text x="300" y="36" class="body" font-size="13">Data Visualization</text>
        <rect x="480" y="16" width="70" height="24" rx="12" fill="#DC2626" fill-opacity="0.2" stroke="#EF4444" stroke-width="1"/>
        <text x="515" y="32" class="btn-text" font-size="11" fill="#EF4444" text-anchor="middle">Hard</text>
        <text x="620" y="36" class="accent" font-size="13" text-decoration="underline">Run Challenge</text>
        <line x1="0" y1="60" x2="720" y2="60" stroke="#1F2937" stroke-width="1"/>
      </g>
      
      <!-- Pagination Footer -->
      <g transform="translate(0, 310)">
        <line x1="0" y1="0" x2="720" y2="0" stroke="#1F2937" stroke-width="1.5"/>
        <text x="32" y="30" class="subtitle" font-size="12">Showing 3 of 48 items</text>
        <g transform="translate(580, 10)">
          <rect width="40" height="30" rx="6" fill="#1F2937"/>
          <text x="20" y="19" class="btn-text" font-size="12">&lt;</text>
          
          <rect x="48" y="0" width="40" height="30" rx="6" fill="#1F2937"/>
          <text x="68" y="19" class="btn-text" font-size="12">&gt;</text>
        </g>
      </g>
    </g>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${defs}
    ${bgFrame}
    ${content}
  </svg>`;
}

// Loop files and rewrite
let successCount = 0;
for (const file of files) {
  try {
    const fullPath = path.join(mockupsDir, file);
    const newContent = generateBeautifulSvg(file);
    fs.writeFileSync(fullPath, newContent, "utf8");
    successCount++;
  } catch (error) {
    console.error(`Failed to redesign ${file}:`, error);
  }
}

console.log(`Successfully redesigned ${successCount} mockup SVGs!`);
process.exit(0);
