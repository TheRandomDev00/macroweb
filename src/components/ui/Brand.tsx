export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a className="brand" href="#top" aria-label="DevRealm home">
      <img src="/images/devrealm.svg" width="40" height="40" alt="" />
      <span>
        Dev<span className="gradient-text">Realm</span>
      </span>
      {footer && <span className="brand-year">EST. 2024</span>}
    </a>
  );
}
