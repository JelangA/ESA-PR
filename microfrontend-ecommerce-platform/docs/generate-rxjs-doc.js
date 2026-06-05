// ============================================================
// generate-rxjs-doc.js
// Jalankan: node generate-rxjs-doc.js
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
  UnderlineType,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ── Helpers ──────────────────────────────────────────────────

/** Heading level 1 */
function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

/** Heading level 2 */
function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

/** Heading level 3 */
function h3(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
  });
}

/** Normal paragraph */
function p(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, ...opts })],
    spacing: { after: 120 },
  });
}

/** Bold paragraph */
function bold(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22 })],
    spacing: { after: 120 },
  });
}

/** Bullet item */
function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level },
    spacing: { after: 80 },
  });
}

/** Code block (monospace, shaded background) */
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

/** Empty line spacer */
function spacer() {
  return new Paragraph({ text: "", spacing: { after: 100 } });
}

/** Simple table with header row */
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

// ── Document Content ─────────────────────────────────────────

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
              text: "Dokumentasi Komunikasi Antar-Services",
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
              text: "Menggunakan RxJS BehaviorSubject",
              bold: true,
              size: 28,
              color: "374151",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Microfrontend E-Commerce Platform",
              size: 24,
              color: "6B7280",
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
        }),

        // ── 1. Gambaran Umum ───────────────────────────────
        h1("1. Gambaran Umum"),
        p(
          "Platform ini menggunakan RxJS BehaviorSubject sebagai mekanisme komunikasi reaktif " +
            "antar-microfrontend. Pola ini memungkinkan semua service (Container, Products/Vue, " +
            "Cart/React, Auth/React) berbagi state secara real-time tanpa coupling langsung antar-service."
        ),
        spacer(),

        // ── 2. Operator RxJS ──────────────────────────────
        h1("2. Operator & Class RxJS yang Digunakan"),
        spacer(),
        table(
          ["Operator / Class", "Digunakan Di", "Fungsi"],
          [
            ["BehaviorSubject", "GlobalStore", "Menyimpan & emit state terkini"],
            ["Observable", "GlobalStore.getState$()", "Stream state yang bisa di-subscribe"],
            ["map", "GlobalStore.select()", "Mengambil slice tertentu dari state"],
            [
              "distinctUntilChanged",
              "GlobalStore.select()",
              "Mencegah emit jika nilai tidak berubah",
            ],
            [".subscribe()", "Semua hooks/composables", "Mendengarkan perubahan state"],
            [".next()", "GlobalStore.dispatch()", "Emit state baru ke semua subscriber"],
            [
              ".asObservable()",
              "GlobalStore.getState$()",
              "Expose stream tanpa kemampuan emit",
            ],
            [".unsubscribe()", "Cleanup di hooks", "Mencegah memory leak"],
          ]
        ),
        spacer(),

        // ── 3. Tahapan Komunikasi ─────────────────────────
        h1("3. Tahapan Komunikasi: Step-by-Step"),

        // Tahap 1
        h2("Tahap 1 — Inisialisasi GlobalStore (Singleton)"),
        p("File: shared/src/store/GlobalStore.ts"),
        p(
          "BehaviorSubject dibuat dengan initial state. Singleton pattern memastikan satu instance " +
            "digunakan di seluruh aplikasi. Saat konstruktor dipanggil, state dipulihkan dari localStorage."
        ),
        ...code([
          "// ① BehaviorSubject dibuat dengan initial state",
          "private state$ = new BehaviorSubject<GlobalState>(initialState);",
          "",
          "// ② Singleton pattern",
          "public static getInstance(): GlobalStore {",
          "  if (!GlobalStore.instance) {",
          "    GlobalStore.instance = new GlobalStore();",
          "  }",
          "  return GlobalStore.instance;",
          "}",
          "",
          "// ③ Konstruktor: load dari localStorage + setup persistence",
          "protected constructor() {",
          "  this.loadFromStorage();",
          "  this.setupStoragePersistence();",
          "}",
          "",
          "// ④ Export singleton langsung",
          "export const globalStore = GlobalStore.getInstance();",
        ]),
        spacer(),
        bold("Kenapa BehaviorSubject?"),
        bullet("Menyimpan nilai terakhir — subscriber baru langsung dapat state terkini"),
        bullet("Bisa di-.next() untuk emit state baru"),
        bullet("Bisa dikonversi ke Observable biasa via .asObservable()"),
        spacer(),

        // Tahap 2
        h2("Tahap 2 — Container Mengekspos Store ke Window"),
        p("File: container/src/context/AppContextRxJS.tsx"),
        p(
          "Container adalah entry point. Dia mengekspos globalStore ke window.__GLOBAL_STORE__ " +
            "agar Auth microfrontend yang berjalan standalone tetap bisa mengakses store."
        ),
        ...code([
          "useEffect(() => {",
          "  // Expose global store ke window untuk microfrontend lain",
          "  window.__GLOBAL_STORE__ = globalStore;",
          "}, []);",
        ]),
        spacer(),

        // Tahap 3
        h2("Tahap 3 — Subscribe ke State (Membaca Data)"),
        p("Setiap framework punya cara berbeda untuk subscribe ke RxJS Observable:"),
        spacer(),

        h3("3a. React Hook (Container & Cart)"),
        p("File: container/src/hooks/useRxJSStore.ts | cart/src/hooks/useRxJSStore.ts"),
        ...code([
          "// Hook generik — subscribe ke seluruh state",
          "export const useGlobalStore = () => {",
          "  const [state, setState] = useState(globalStore.getState());",
          "",
          "  useEffect(() => {",
          "    const unsubscribe = globalStore.subscribe(setState);",
          "    return unsubscribe; // cleanup saat unmount",
          "  }, []);",
          "",
          "  return { state };",
          "};",
          "",
          "// Hook untuk slice tertentu — lebih efisien",
          "// Menggunakan select() yang sudah pakai distinctUntilChanged()",
          "export const useGlobalSelector = (key) => {",
          "  const [value, setValue] = useState(globalStore.getState()[key]);",
          "",
          "  useEffect(() => {",
          "    const subscription = globalStore.select(key).subscribe(setValue);",
          "    return () => subscription.unsubscribe();",
          "  }, [key]);",
          "",
          "  return value;",
          "};",
        ]),
        spacer(),

        h3("3b. Vue Composable (Products)"),
        p("File: products/src/composables/useRxJSStore.ts"),
        ...code([
          "export const useGlobalStore = () => {",
          "  const state = ref(globalStore.getState());",
          "  let subscription = null;",
          "",
          "  onMounted(() => {",
          "    subscription = globalStore.subscribe((newState) => {",
          "      state.value = newState; // Vue reactive ref auto re-render",
          "    });",
          "  });",
          "",
          "  onUnmounted(() => {",
          "    if (subscription) subscription(); // cleanup",
          "  });",
          "",
          "  return { state: computed(() => state.value) };",
          "};",
          "",
          "// computed() di Vue = otomatis reaktif terhadap perubahan state",
          "const isInCart = (productId) =>",
          "  computed(() => cart.value.some(item => item.productId === productId));",
        ]),
        spacer(),

        h3("3c. Auth via window (Fallback)"),
        p("File: auth/src/hooks/useRxJSStore.ts"),
        ...code([
          "export const useAuthRxJS = () => {",
          "  const [user, setUser] = useState(null);",
          "",
          "  useEffect(() => {",
          "    const globalStore = window.__GLOBAL_STORE__;",
          "    if (!globalStore) return; // graceful fallback jika standalone",
          "",
          "    const subscription = globalStore.state$.subscribe((state) => {",
          "      setUser(state.user);",
          "    });",
          "",
          "    return () => subscription.unsubscribe();",
          "  }, []);",
          "",
          "  return { isAuthenticated: !!user, user };",
          "};",
        ]),
        spacer(),

        // Tahap 4
        h2("Tahap 4 — Dispatch Action (Menulis Data)"),
        p("File: shared/src/store/GlobalStore.ts"),
        ...code([
          "dispatch(action) {",
          "  const currentState = this.state$.value;       // baca state saat ini",
          "  const newState = globalReducer(currentState, action); // hitung state baru",
          "  this.state$.next(newState);                   // emit ke semua subscriber",
          "}",
          "",
          "// Convenience method (wrapper dispatch)",
          "addToCart(product, quantity = 1) {",
          "  const currentState = this.getState();",
          "  if (!currentState.products.find(p => p.id === product.id)) {",
          "    this.setProducts([...currentState.products, product]);",
          "  }",
          "  this.dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } });",
          "}",
        ]),
        spacer(),

        // Tahap 5
        h2("Tahap 5 — Alur Lengkap: User Klik 'Add to Cart'"),
        p("Berikut alur lengkap saat user mengklik tombol Add to Cart di Products (Vue):"),
        spacer(),
        table(
          ["Langkah", "Lokasi", "Aksi"],
          [
            ["1", "ProductCard.vue", "User klik → addToCart() dipanggil"],
            ["2", "useRxJSStore.ts (Vue)", "addToRxJSCart(product, 1) dipanggil"],
            ["3", "GlobalStore.ts", "dispatch({ type: 'ADD_TO_CART', payload })"],
            ["4", "GlobalStore.ts", "globalReducer() hitung state baru"],
            ["5", "GlobalStore.ts", "state$.next(newState) — BehaviorSubject emit"],
            ["6", "Container (React)", "useGlobalSelector('cart') → Header re-render, badge update"],
            ["7", "Cart (React)", "useGlobalSelector('cart') → CartContent re-render"],
            ["8", "GlobalStore.ts", "setupStoragePersistence() → localStorage auto-save"],
          ]
        ),
        spacer(),

        // Tahap 6
        h2("Tahap 6 — Reducer: Logika State Transition"),
        p("File: shared/src/store/GlobalStore.ts"),
        p("Pure reducer function — tidak ada side effect, selalu immutable update:"),
        ...code([
          "const globalReducer = (state, action) => {",
          "  switch (action.type) {",
          "    case 'ADD_TO_CART': {",
          "      const existingIndex = state.cart.findIndex(",
          "        item => item.productId === action.payload.product.id",
          "      );",
          "      let newCart;",
          "      if (existingIndex >= 0) {",
          "        // Update quantity jika sudah ada",
          "        newCart = state.cart.map((item, i) =>",
          "          i === existingIndex",
          "            ? { ...item, quantity: item.quantity + action.payload.quantity }",
          "            : item",
          "        );",
          "      } else {",
          "        // Tambah item baru",
          "        newCart = [...state.cart, {",
          "          productId: action.payload.product.id,",
          "          quantity: action.payload.quantity,",
          "        }];",
          "      }",
          "      return { ...state, cart: newCart }; // immutable",
          "    }",
          "    case 'REMOVE_FROM_CART':",
          "      return { ...state, cart: state.cart.filter(",
          "        item => item.productId !== action.payload",
          "      )};",
          "    case 'SET_USER':",
          "      return { ...state, user: action.payload };",
          "    case 'CLEAR_CART':",
          "      return { ...state, cart: [] };",
          "    default:",
          "      return state;",
          "  }",
          "};",
        ]),
        spacer(),

        // Tahap 7
        h2("Tahap 7 — Persistensi Otomatis ke localStorage"),
        p("File: shared/src/store/GlobalStore.ts"),
        p(
          "Setiap kali state berubah, data penting otomatis disimpan ke localStorage. " +
            "Saat aplikasi dibuka kembali, state dipulihkan dari localStorage."
        ),
        ...code([
          "private setupStoragePersistence() {",
          "  this.state$.subscribe((state) => {",
          "    // Hanya simpan data penting (bukan loading/error yang transient)",
          "    const persistentState = {",
          "      cart: state.cart,",
          "      user: state.user,",
          "    };",
          "    localStorage.setItem(",
          "      'microfrontend-global-state',",
          "      JSON.stringify(persistentState)",
          "    );",
          "",
          "    // Kompatibilitas dengan format lama (auth app)",
          "    if (state.user) {",
          "      localStorage.setItem('authUser', JSON.stringify(state.user));",
          "      localStorage.setItem('authToken', 'dummy-token');",
          "    } else {",
          "      localStorage.removeItem('authUser');",
          "      localStorage.removeItem('authToken');",
          "    }",
          "  });",
          "}",
        ]),
        spacer(),

        // ── 4. Keunggulan ─────────────────────────────────
        h1("4. Keunggulan Pola RxJS Singleton Store"),
        bullet("Framework-agnostic — bekerja di React (hooks), Vue (composables), maupun vanilla JS"),
        bullet("Single source of truth — satu BehaviorSubject untuk semua state"),
        bullet("Reactive — perubahan state otomatis propagate ke semua subscriber"),
        bullet("Persistent — state otomatis disimpan ke localStorage"),
        bullet("Type-safe — semua action dan state didefinisikan dengan TypeScript"),
        bullet("Memory-safe — setiap subscriber cleanup via unsubscribe() di lifecycle hooks"),
        spacer(),

        // ── Footer ────────────────────────────────────────
        new Paragraph({
          children: [
            new TextRun({
              text: "Microfrontend E-Commerce Platform — RxJS Communication Documentation",
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
const outputPath = path.join(__dirname, "RXJS-COMMUNICATION.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log("✅ File berhasil dibuat:", outputPath);
});
