declare module 'products/App' {
  const ProductsApp: React.ComponentType;
  export default ProductsApp;
}

declare module 'cart/App' {
  const CartApp: React.ComponentType;
  export default CartApp;
}

declare module 'auth/App' {
  const AuthApp: React.ComponentType;
  export default AuthApp;
}

declare global {
  interface Window {
    __POWERED_BY_MODULE_FEDERATION__?: boolean;
  }
}
