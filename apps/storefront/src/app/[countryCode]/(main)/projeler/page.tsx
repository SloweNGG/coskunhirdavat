import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import ProjectGrid from "@modules/home/components/project-grid"
import PartFinder from "@modules/home/components/part-finder"

export const metadata: Metadata = {
  title: `Ne yapacaksınız? İşe göre malzeme listeleri | ${STORE_NAME}`,
  description:
    "Raf asmaktan musluk değiştirmeye, işinize göre gereken malzemelerin listesi ve adım adım ipuçları.",
}

export default function ProjectsPage() {
  return (
    <>
      <ProjectGrid />
      <PartFinder />
    </>
  )
}
