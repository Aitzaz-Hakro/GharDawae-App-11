// Ambient type declarations for CSS imports (NativeWind / global styles).
declare module "*.css";
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
