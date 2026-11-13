export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a className="brand" href="#top" aria-label="Informaal Frog home">
      <img src="/images/informaal.png" width="40" height="40" alt="" />
      <span>
        INFORMAAL<span className="gradient-text">FROG</span>
      </span>
      {footer && <span className="brand-year">EST. 2024</span>}
    </a>
  );
}
