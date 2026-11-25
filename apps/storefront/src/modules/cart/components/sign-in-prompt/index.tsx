import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-4">
      <div>
        <Heading level="h2" className="text-[15px] font-semibold text-navy">
          Hesabınız var mı?
        </Heading>
        <Text className="mt-0.5 text-sm text-muted">
          Daha hızlı alışveriş için giriş yapın.
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button
            variant="secondary"
            className="h-10"
            data-testid="sign-in-button"
          >
            Giriş yap
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
