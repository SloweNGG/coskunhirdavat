import { Metadata } from "next"
import { notFound } from "next/navigation"

import { ArrowRight, ExclamationCircle } from "@medusajs/icons"
import { getProject, PROJECTS } from "@lib/projects"
import { STORE_INFO } from "@lib/store-config"
import { STORE_NAME } from "@lib/util/site"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoreIcon from "@modules/common/components/store-icon"
import TapeMeasure from "@modules/common/components/tape-measure"
import ShoppingList from "@modules/projects/components/shopping-list"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const project = getProject(slug)

  if (!project) {
    return { title: STORE_NAME }
  }

  return {
    title: `${project.title}: malzeme listesi | ${STORE_NAME}`,
    description: `${project.summary} Gereken ${project.items.length} malzeme ve adım adım ipuçları.`,
  }
}

export default async function ProjectPage(props: Props) {
  const { slug } = await props.params
  const project = getProject(slug)

  if (!project) {
    notFound()
  }

  const others = PROJECTS.filter((p) => p.slug !== project.slug).slice(0, 3)

  return (
    <>
      {/* Header */}
      <section className="blueprint-dark bg-navy text-white">
        <div className="content-container flex flex-col gap-5 py-10 small:py-14">
          <nav className="flex items-center gap-x-2 font-mono text-xs uppercase text-white/50">
            <LocalizedClientLink href="/" className="hover:text-white">
              Ana Sayfa
            </LocalizedClientLink>
            <span>/</span>
            <LocalizedClientLink href="/projeler" className="hover:text-white">
              Ne Yapacaksınız?
            </LocalizedClientLink>
          </nav>
          <div className="flex items-start gap-5">
            <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-fg xsmall:flex">
              <StoreIcon name={project.icon} className="h-8 w-8" />
            </span>
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl font-bold leading-tight small:text-4xl">
                {project.title}
              </h1>
              <p className="max-w-2xl text-white/75">{project.summary}</p>
            </div>
          </div>
          <dl className="grid w-fit grid-cols-3 border border-white/15 font-mono text-xs uppercase">
            {[
              ["Zorluk", project.difficulty],
              ["Süre", project.duration],
              ["Malzeme", String(project.items.length)],
            ].map(([label, value]) => (
              <div key={label} className="border-r border-white/15 px-4 py-2 last:border-r-0">
                <dt className="text-white/45">{label}</dt>
                <dd className="text-sm font-semibold text-brand-bright">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <TapeMeasure variant="band" />
      </section>

      {/* Body */}
      <div className="content-container grid grid-cols-1 gap-8 py-10 small:grid-cols-[1.6fr_1fr] small:py-14">
        <ShoppingList
          projectTitle={project.title}
          items={project.items}
          whatsappNumber={STORE_INFO.whatsappNumber}
        />

        <aside className="flex flex-col gap-6">
          <div className="rounded-xl border border-line bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-navy">Adım adım</h2>
            <ol className="flex flex-col gap-4">
              {project.steps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-navy font-mono text-xs font-bold text-brand-bright">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-navy">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {project.warning && (
            <div className="flex gap-3 rounded-xl border border-sale/30 bg-sale/5 p-5 text-sm text-navy">
              <ExclamationCircle className="mt-0.5 shrink-0 text-sale" />
              <p>{project.warning}</p>
            </div>
          )}

          <div className="rounded-xl border border-brand/30 bg-brand-50 p-5 text-sm text-navy">
            <p className="font-semibold">Emin olamadınız mı?</p>
            <p className="mt-1 text-muted">
              Ölçü ya da uyumluluk konusunda tereddütte kalırsanız bizi arayın, doğru
              ürünü birlikte seçelim.
            </p>
            <a
              href={STORE_INFO.phoneHref}
              className="mt-3 inline-flex font-mono font-semibold text-brand-ink hover:underline"
            >
              {STORE_INFO.phone}
            </a>
          </div>
        </aside>
      </div>

      {/* Other projects */}
      <section className="border-t border-line bg-soft">
        <div className="content-container py-10">
          <h2 className="mb-5 text-xl font-bold text-navy">Diğer işler</h2>
          <ul className="grid grid-cols-1 gap-3 small:grid-cols-3">
            {others.map((p) => (
              <li key={p.slug}>
                <LocalizedClientLink
                  href={`/projeler/${p.slug}`}
                  className="group flex items-center gap-4 rounded-xl border border-line bg-white p-4 hover:border-brand"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy text-brand-bright">
                    <StoreIcon name={p.icon} className="h-5 w-5" />
                  </span>
                  <span className="flex-1 font-semibold text-navy">{p.title}</span>
                  <ArrowRight className="text-brand-ink" />
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
