import { Controller } from "@hotwired/stimulus"
import { marked, Renderer } from "marked"

const renderer = new Renderer()
renderer.link = ({ href, title, text }: { href: string; title?: string | null; text: string }) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer"${title ? ` title="${title}"` : ""}>${text}</a>`
marked.use({ renderer })

export default class extends Controller {
  static targets = [
    "panel",
    "messages",
    "loading",
    "faqArea",
    "input",
    "sendButton",
    "toggleButton",
    "iconOpen",
    "iconClose",
  ]

  declare readonly panelTarget: HTMLElement
  declare readonly messagesTarget: HTMLElement
  declare readonly loadingTarget: HTMLElement
  declare readonly faqAreaTarget: HTMLElement
  declare readonly inputTarget: HTMLInputElement
  declare readonly sendButtonTarget: HTMLButtonElement
  declare readonly toggleButtonTarget: HTMLButtonElement
  declare readonly iconOpenTarget: SVGElement
  declare readonly iconCloseTarget: SVGElement

  private isOpen = false

  connect(): void {
    void this.fetchFaqs()
  }

  toggle(): void {
    this.isOpen = !this.isOpen
    this.panelTarget.classList.toggle("hidden", !this.isOpen)
    this.iconOpenTarget.classList.toggle("hidden", this.isOpen)
    this.iconCloseTarget.classList.toggle("hidden", !this.isOpen)
    this.toggleButtonTarget.setAttribute("aria-expanded", String(this.isOpen))

    if (this.isOpen) {
      requestAnimationFrame(() => this.inputTarget.focus())
    }
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault()
    const question = this.inputTarget.value.trim()
    if (!question) return

    this.inputTarget.value = ""
    await this.sendQuestion(question)
  }

  askFaq(event: Event): void {
    const button = event.currentTarget as HTMLButtonElement
    const question = button.dataset.question ?? ""
    if (!question) return
    void this.sendQuestion(question)
  }

  private async fetchFaqs(): Promise<void> {
    try {
      const response = await fetch("/chatbot/faq", {
        headers: { Accept: "application/json" },
      })
      if (!response.ok) return

      const questions = (await response.json()) as string[]
      if (questions.length === 0) return

      this.faqAreaTarget.innerHTML = ""
      questions.forEach((q) => {
        const btn = document.createElement("button")
        btn.type = "button"
        btn.textContent = q
        btn.dataset.question = q
        btn.dataset.action = "click->chatbot#askFaq"
        btn.className =
          "rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] " +
          "text-stone-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800 transition-colors truncate max-w-full"
        this.faqAreaTarget.appendChild(btn)
      })

      this.faqAreaTarget.classList.remove("hidden")
    } catch {
      // FAQ is best-effort; silently skip if Flask is unavailable
    }
  }

  private async sendQuestion(question: string): Promise<void> {
    this.appendMessage("user", question)
    this.setLoading(true)

    try {
      const response = await fetch("/chatbot/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": this.csrfToken(),
          Accept: "application/json",
        },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = (await response.json()) as { answer: string }
      this.appendMessage("assistant", data.answer)
    } catch {
      this.appendMessage(
        "assistant",
        "Lo siento, no pude obtener una respuesta. Por favor, inténtalo de nuevo."
      )
    } finally {
      this.setLoading(false)
    }
  }

  private appendMessage(role: "user" | "assistant", text: string): void {
    const wrapper = document.createElement("div")
    wrapper.className = "flex gap-2.5" + (role === "user" ? " justify-end" : "")

    if (role === "assistant") {
      const avatar = document.createElement("span")
      avatar.className =
        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full " +
        "bg-sky-100 text-sky-700 text-xs font-bold"
      avatar.textContent = "PA"
      wrapper.appendChild(avatar)
    }

    const bubble = document.createElement(role === "assistant" ? "div" : "p")
    if (role === "assistant") {
      bubble.innerHTML = marked.parse(text) as string
    } else {
      bubble.textContent = text
    }
    bubble.className =
      role === "user"
        ? "rounded-2xl rounded-tr-none bg-sky-600 px-3 py-2 text-sm text-white leading-relaxed max-w-[80%]"
        : "chat-prose rounded-2xl rounded-tl-none bg-stone-100 px-3 py-2 text-sm text-stone-800 leading-relaxed max-w-[80%]"
    wrapper.appendChild(bubble)

    this.messagesTarget.appendChild(wrapper)
    this.scrollToBottom()
  }

  private setLoading(loading: boolean): void {
    this.loadingTarget.classList.toggle("hidden", !loading)
    this.inputTarget.disabled = loading
    this.sendButtonTarget.disabled = loading
    if (loading) this.scrollToBottom()
  }

  private scrollToBottom(): void {
    this.messagesTarget.scrollTop = this.messagesTarget.scrollHeight
  }

  private csrfToken(): string {
    return (
      document
        .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
        ?.getAttribute("content") ?? ""
    )
  }
}
