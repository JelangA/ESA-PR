// ============================================================
// generate-composition-doc.js
// Jalankan: node generate-composition-doc.js
// Dependency: npm install docx
// ============================================================

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  convertInchesToTwip,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Helpers ──────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
  });
}

function p(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  });
}

function bold(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22 })],
    spacing: { after: 120 },
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level },
    spacing: { after: 80 },
  });
}

function code(lines) {
  return lines.map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            font: "Courier New",
            size: 18,
            color: "1F2937",
          }),
        ],
        shading: { type: ShadingType.CLEAR, fill: "F3F4F6" },
        spacing: { after: 0, before: 0 },
        indent: { left: convertInchesToTwip(0.3) },
      })
  );
}

function spacer() {
  return new Paragraph({ text: "", spacing: { after: 120 } });
}

function table(headers, rows) {
  const headerCells = headers.map(
    (h) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: h, bold: true, size: 20, color: "FFFFFF" })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { type: ShadingType.CLEAR, fill: "1D4ED8" },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      })
  );

  const dataRows = rows.map(
    (row, ri) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cell, size: 20 })],
                }),
              ],
              shading: {
                type: ShadingType.CLEAR,
                fill: ri % 2 === 0 ? "EFF6FF" : "FFFFFF",
              },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
  });
}

/** Kotak info berwarna (simulasi callout) */
function infoBox(label, text, fill = "DBEAFE") {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: label + " ", bold: true, size: 20, color: "1D4ED8" }),
                  new TextRun({ text, size: 20 }),
                ],
              }),
            ],
            shading: { type: ShadingType.CLEAR, fill },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
          }),
        ],
      }),
    ],
  });
}

// ── Document ─────────────────────────────────────────────────

const doc = new Document({
  styles: {
    paragraphStyles: [
      {
        id: "Normal",
        name: "Normal",
        run: { font: "Calibri", size: 22 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.2),
            right: convertInchesToTwip(1.2),
          },
        },
      },
      children: [
        // ── Cover ──────────────────────────────────────────
        new Paragraph({
          children: [
            new TextRun({
              text: "Analisa Jenis Komposisi Microfrontend",
              bold: true,
              size: 36,
              color: "1D4ED8",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 800, after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Microfrontend E-Commerce Platform",
              size: 26,
              color: "374151",
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
        }),

        // ── 1. Ringkasan Eksekutif ─────────────────────────
        h1("1. Ringkasan Eksekutif"),
        p(
          "Platform ini menggunakan kombinasi dua jenis komposisi microfrontend secara bersamaan. " +
            "Berikut tabel perbandingan jenis komposisi yang digunakan:"
        ),
        spacer(),
        table(
          ["Jenis Komposisi", "Digunakan", "Keterangan"],
          [
            ["Client-Side Composition", "✅ Utama", "Webpack Module Federation"],
            ["Run-time Integration", "✅ Utama", "Dynamic remote loading"],
            ["Build-time Integration", "❌ Tidak", "Tidak ada pre-bundling bersama"],
            ["Server-Side Composition", "❌ Tidak", "Tidak ada SSR/edge composition"],
            ["iFrame Composition", "❌ Tidak", "Tidak ada isolasi iframe"],
          ]
        ),
        spacer(),
        infoBox(
          "Kesimpulan:",
          "Platform ini menggunakan Client-Side Composition via Webpack Module Federation " +
            "(Run-time Integration) sebagai pola utama."
        ),
        spacer(),

        // ── 2. Client-Side Composition ─────────────────────
        h1("2. Jenis Komposisi: Client-Side Composition"),
        p(
          "Komposisi dilakukan di browser (client), bukan di server. Container/shell app memuat " +
            "dan merakit microfrontend secara dinamis saat runtime."
        ),
        spacer(),

        h2("2.1 Container sebagai Shell App"),
        p("File: container/src/App.tsx"),
        p("Container bertindak sebagai orchestrator yang merutekan ke masing-masing remote MFE:"),
        ...code([
          "// container/src/App.tsx",
          "<AppProvider>          // ← RxJS global state",
          "  <Router>",
          "    <Route path='/'           element={<Home />} />",
          "    <Route path='/products/*' element={<RemoteProductsApp />} />",
          "    <Route path='/cart/*'     element={<RemoteCartApp />} />",
          "    <Route path='/auth/*'     element={<RemoteAuthApp />} />",
          "  </Router>",
          "</AppProvider>",
        ]),
        spacer(),

        h2("2.2 Konfigurasi Webpack Module Federation"),
        p(
          "Container hanya sebagai host — tidak mengekspos apapun, hanya mengkonsumsi remote MFE:"
        ),
        ...code([
          "// container/webpack.config.js",
          "new ModuleFederationPlugin({",
          "  name: 'container',",
          "  // Tidak ada 'exposes' — murni sebagai host/shell",
          "  remotes: isProd",
          "    ? {",
          "        products: 'products@/products/remoteEntry.js',",
          "        cart:     'cart@/cart/remoteEntry.js',",
          "        auth:     'auth@/auth/remoteEntry.js',",
          "      }",
          "    : {",
          "        products: 'products@http://localhost:3001/remoteEntry.js',",
          "        cart:     'cart@http://localhost:3002/remoteEntry.js',",
          "        auth:     'auth@http://localhost:3003/remoteEntry.js',",
          "      },",
          "})",
        ]),
        spacer(),

        h2("2.3 Konfigurasi Setiap Remote"),
        p("Products (Vue + React Wrapper) — Port 3001:"),
        ...code([
          "new ModuleFederationPlugin({",
          "  name: 'products',",
          "  filename: 'remoteEntry.js',",
          "  exposes: {",
          "    './App': './src/ReactWrapper.tsx', // React wrapper yang mount Vue app",
          "  },",
          "  shared: {",
          "    react: { singleton: true },",
          "    vue: { singleton: true },",
          "    'vue-router': { singleton: true },",
          "    pinia: { singleton: true },",
          "    '@microfrontend-ecommerce/shared': { singleton: true },",
          "  },",
          "})",
        ]),
        spacer(),
        p("Cart (React) — Port 3002:"),
        ...code([
          "new ModuleFederationPlugin({",
          "  name: 'cart',",
          "  filename: 'remoteEntry.js',",
          "  exposes: {",
          "    './App': './src/App', // expose React App langsung",
          "  },",
          "  shared: {",
          "    react: { singleton: true },",
          "    'react-dom': { singleton: true },",
          "    '@microfrontend-ecommerce/shared': { singleton: true },",
          "  },",
          "})",
        ]),
        spacer(),

        // ── 3. Cross-Framework Composition ────────────────
        h1("3. Pola Khusus: Cross-Framework Composition"),
        p(
          "Platform ini mengimplementasikan Cross-Framework Microfrontend Composition — " +
            "menggabungkan dua framework berbeda (React dan Vue 3) dalam satu halaman."
        ),
        spacer(),

        h2("3.1 Hierarki Framework"),
        table(
          ["Level", "Komponen", "Framework", "Keterangan"],
          [
            ["1 (Shell)", "Container App", "React 18", "Host, routing, global state"],
            ["2 (Bridge)", "ReactWrapper.tsx", "React 18", "Jembatan React → Vue"],
            ["3 (MFE)", "App.vue + Components", "Vue 3", "UI produk sebenarnya"],
            ["2 (MFE)", "Cart App", "React 18", "Standalone React MFE"],
            ["2 (MFE)", "Auth App", "React 18", "Standalone React MFE"],
          ]
        ),
        spacer(),

        h2("3.2 Implementasi Bridge Pattern (ReactWrapper)"),
        p("File: products/src/ReactWrapper.tsx"),
        p(
          "React komponen yang menjadi jembatan untuk mount Vue app ke dalam DOM React:"
        ),
        ...code([
          "const ReactWrapper: React.FC = () => {",
          "  const ref = useRef(null);",
          "  const appRef = useRef(null);",
          "",
          "  useEffect(() => {",
          "    if (ref.current && !appRef.current) {",
          "      // ① Vue Router dengan memory history",
          "      //    (tidak konflik dengan React Router di container)",
          "      const router = createRouter({",
          "        history: createMemoryHistory(),",
          "        routes,",
          "      });",
          "",
          "      // ② Pinia untuk state lokal Vue",
          "      const pinia = createPinia();",
          "",
          "      // ③ Mount Vue app ke dalam div React",
          "      appRef.current = createApp(App);",
          "      appRef.current.use(router);",
          "      appRef.current.use(pinia);",
          "      appRef.current.mount(ref.current);",
          "",
          "      // ④ Sinkronisasi URL browser → Vue memory router",
          "      window.addEventListener('popstate', syncUrl);",
          "    }",
          "    return () => {",
          "      // ⑤ Cleanup: unmount Vue saat React unmount",
          "      if (appRef.current) {",
          "        appRef.current.unmount();",
          "        appRef.current = null;",
          "      }",
          "    };",
          "  }, []);",
          "",
          "  return <div ref={ref} />; // ← Vue app di-mount ke sini",
          "};",
        ]),
        spacer(),

        // ── 4. Routing Composition ─────────────────────────
        h1("4. Pola Routing: Nested Routing Composition"),
        p(
          "Platform menggunakan dua router yang bekerja secara paralel tanpa konflik:"
        ),
        spacer(),
        table(
          ["Browser URL", "Container Router", "Vue Memory Router"],
          [
            ["/", "<Home />", "-"],
            ["/products", "<RemoteProductsApp>", "/products"],
            ["/products/product/1", "<RemoteProductsApp>", "/product/1"],
            ["/cart", "<RemoteCartApp>", "-"],
            ["/auth", "<RemoteAuthApp>", "-"],
          ]
        ),
        spacer(),
        p(
          "Container menggunakan BrowserRouter (HTML5 History API). " +
            "Products Vue menggunakan MemoryHistory agar tidak mengubah URL browser, " +
            "kemudian disinkronisasi secara manual via event popstate."
        ),
        spacer(),

        // ── 5. State Management Composition ───────────────
        h1("5. Pola State: Dual-Layer State Composition"),
        p("Platform menggunakan dua lapisan state secara bersamaan:"),
        spacer(),
        table(
          ["Layer", "Teknologi", "Scope", "Data yang Disimpan"],
          [
            [
              "Global State",
              "RxJS BehaviorSubject",
              "Semua MFE",
              "cart, user, products, loading, error",
            ],
            [
              "Local State (Products)",
              "Pinia",
              "Products MFE saja",
              "filteredProducts, categories, selectedSort",
            ],
            [
              "Local State (Cart/Auth)",
              "React useState",
              "Per komponen",
              "UI state (showConfirm, isSignup, form)",
            ],
          ]
        ),
        spacer(),
        infoBox(
          "Catatan:",
          "Products menggunakan Pinia untuk state lokal (daftar produk dari API, filter, sort) " +
            "karena ini data yang hanya relevan untuk Products MFE. Saat user menambah ke cart, " +
            "data product dikirim ke GlobalStore (RxJS) agar Cart MFE bisa menampilkan detail produk.",
          "FEF9C3"
        ),
        spacer(),

        // ── 6. Error Isolation ─────────────────────────────
        h1("6. Pola Isolasi: Error Boundary Composition"),
        p(
          "Setiap microfrontend dibungkus ErrorBoundary untuk isolasi kegagalan. " +
            "Jika satu MFE crash, Container dan MFE lain tetap berjalan normal."
        ),
        ...code([
          "// container/src/App.tsx",
          "<ErrorBoundary microfrontendName='Products'>",
          "  <MicrofrontendWrapper>",
          "    <RemoteProductsApp />",
          "  </MicrofrontendWrapper>",
          "</ErrorBoundary>",
        ]),
        spacer(),

        // ── 7. Ringkasan Pola Desain ───────────────────────
        h1("7. Ringkasan Pola Desain yang Digunakan"),
        spacer(),
        table(
          ["Pola Desain", "Digunakan Di", "Tujuan"],
          [
            [
              "Shell/Host Pattern",
              "Container App",
              "Orchestrator yang merakit semua MFE",
            ],
            [
              "Singleton Store Pattern",
              "GlobalStore (RxJS)",
              "Satu instance state untuk semua MFE",
            ],
            [
              "Bridge Pattern",
              "ReactWrapper.tsx",
              "Jembatan React ↔ Vue",
            ],
            [
              "Facade Pattern",
              "CartContextRxJS",
              "Menyembunyikan kompleksitas RxJS dari komponen",
            ],
            [
              "Observer Pattern",
              "BehaviorSubject subscriptions",
              "Reaktif terhadap perubahan state",
            ],
            [
              "Reducer Pattern",
              "globalReducer()",
              "Immutable state transitions",
            ],
          ]
        ),
        spacer(),

        // ── 8. Trade-off ───────────────────────────────────
        h1("8. Trade-off dan Pertimbangan"),

        h2("Kelebihan"),
        bullet("Independent deployment — setiap MFE bisa di-deploy sendiri"),
        bullet("Technology diversity — React dan Vue bisa hidup berdampingan"),
        bullet("Shared state tanpa coupling — RxJS singleton menghindari prop drilling"),
        bullet("Standalone mode — setiap MFE bisa jalan sendiri untuk development"),
        bullet("Error isolation — kegagalan satu MFE tidak merusak yang lain"),
        spacer(),

        h2("Keterbatasan"),
        bullet("Bundle size — React dan Vue keduanya di-load meski singleton"),
        bullet(
          "Kompleksitas routing — sinkronisasi manual URL browser ↔ Vue memory router"
        ),
        bullet(
          "window.__GLOBAL_STORE__ — Auth bergantung pada global window object sebagai fallback"
        ),
        bullet(
          "Pinia + RxJS — Products menggunakan dua state management sekaligus"
        ),
        spacer(),

        // ── Footer ────────────────────────────────────────
        new Paragraph({
          children: [
            new TextRun({
              text: "Microfrontend E-Commerce Platform — Composition Analysis Documentation",
              size: 18,
              color: "9CA3AF",
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 },
        }),
      ],
    },
  ],
});

// ── Write File ────────────────────────────────────────────────
const outputPath = path.join(__dirname, "MICROFRONTEND-COMPOSITION.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log("✅ File berhasil dibuat:", outputPath);
});
