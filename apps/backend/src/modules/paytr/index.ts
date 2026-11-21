import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import PaytrProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [PaytrProviderService],
})
