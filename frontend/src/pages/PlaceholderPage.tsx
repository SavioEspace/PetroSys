interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({
  title,
  description
}: PlaceholderPageProps) {
  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="page-kicker">
            PetroSys
          </span>

          <h1>
            {title}
          </h1>

          <p>
            {description}
          </p>
        </div>
      </div>

      <div className="placeholder-module">
        <span>
          Módulo preparado
        </span>

        <h2>
          {title}
        </h2>

        <p>
          A estrutura de navegação
          está pronta. A interface
          funcional deste módulo
          será implementada nas
          próximas etapas.
        </p>
      </div>
    </section>
  );
}