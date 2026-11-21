import { ArrowRight } from "@medusajs/icons"
import { PROJECTS } from "@lib/projects"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoreIcon from "@modules/common/components/store-icon"
import SectionHeading from "../section-heading"

const ProjectGrid = () => {
  return (
    <section className="blueprint-light border-y border-line bg-brand-50/40">
      <div className="content-container py-10 small:py-14">
        <SectionHeading
          eyebrow="02 / İşe göre alışveriş"
          title="Ne yapacaksınız?"
          subtitle="İşinizi seçin, gereken malzemelerin listesini ve adım adım ipuçlarını hazırlayalım"
          href="/projeler"
          linkLabel="Tüm işler"
        />
        <ul className="grid grid-cols-1 gap-3 xsmall:grid-cols-2 small:grid-cols-3 small:gap-4">
          {PROJECTS.map((project, index) => (
            <li key={project.slug}>
              <LocalizedClientLink
                href={`/projeler/${project.slug}`}
                className="group relative flex h-full items-start gap-4 rounded-xl border border-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
              >
                <span className="absolute right-4 top-4 font-mono text-[11px] font-semibold text-navy/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy text-brand-bright transition-colors group-hover:bg-brand group-hover:text-brand-fg">
                  <StoreIcon name={project.icon} className="h-6 w-6" />
                </span>
                <span className="flex flex-col gap-1.5 pr-6">
                  <span className="text-base font-bold leading-snug text-navy">
                    {project.title}
                  </span>
                  <span className="text-sm leading-snug text-muted">
                    {project.summary}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] font-semibold uppercase text-navy/60">
                    <span>{project.items.length} malzeme</span>
                    <span>·</span>
                    <span>{project.duration}</span>
                    <span>·</span>
                    <span>{project.difficulty}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-x-1 text-sm font-semibold text-brand-ink group-hover:underline">
                    Listeyi gör <ArrowRight />
                  </span>
                </span>
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default ProjectGrid
