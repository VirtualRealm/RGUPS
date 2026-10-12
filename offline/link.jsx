export default function Link({ href, children, ...props }) {
  return (
    <a {...props} href={typeof href === "string" ? href : href.pathname}>
      {children}
    </a>
  );
}
