import { Camera, ChatBubbleLeftRight, MagnifyingGlass } from "@medusajs/icons"
import { PART_FINDER_MESSAGE, whatsappLink } from "@lib/store-config"
import TapeMeasure from "@modules/common/components/tape-measure"

const STEPS = [
  {
    icon: Camera,
    title: "Fotoğrafını çekin",
    text: "Parçayı düz bir zemine koyun, yanına bir metre ya da bozuk para koyarak çekin.",
  },
  {
    icon: ChatBubbleLeftRight,
    title: "WhatsApp'tan gönderin",
    text: "Fotoğrafı ve varsa üzerindeki yazıları bize iletin.",
  },
  {
    icon: MagnifyingGlass,
    title: "Eşini bulalım",
    text: "Ustalarımız parçayı tanıyıp size uygun ürünü ve fiyatını iletsin.",
  },
]

/** "Send a photo, we find the part" service banner. */
const PartFinder = () => {
  return (
    <section className="content-container py-10 small:py-14">
      <div className="blueprint-dark relative overflow-hidden rounded-xl bg-navy text-white">
        <TapeMeasure variant="band" />
        <div className="grid grid-cols-1 gap-10 p-8 small:grid-cols-[1fr_1.4fr] small:items-center small:p-12">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-bright">
              Parça Bulma Servisi
            </span>
            <h2 className="text-3xl font-bold leading-tight small:text-4xl">
              Parçanın adını bilmiyor musunuz?
              <br />
              <span className="text-brand-bright">Fotoğrafını gönderin, eşini bulalım.</span>
            </h2>
            <p className="text-white/75">
              Kırılan bir conta, kaybolan bir vida, eskimiş bir musluk parçası...
              Adını bilmeniz gerekmez; fotoğrafı yeter.
            </p>
            <a
              href={whatsappLink(PART_FINDER_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex w-fit items-center gap-x-2 rounded-lg bg-brand px-6 py-3.5 text-sm font-semibold text-brand-fg hover:bg-brand-dark"
            >
              <Camera />
              Fotoğraf Gönder
            </a>
          </div>

          <ol className="grid grid-cols-1 gap-4 xsmall:grid-cols-3">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="relative flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-5"
              >
                <span className="font-mono text-3xl font-bold text-brand-bright/90">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <step.icon className="h-6 w-6 text-white/80" />
                <span className="font-semibold">{step.title}</span>
                <span className="text-sm leading-snug text-white/65">{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default PartFinder
