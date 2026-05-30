import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input"]

  declare readonly inputTarget: HTMLInputElement
  declare readonly hasInputTarget: boolean

  connect(): void {
    document.addEventListener("keydown", this.handleKeydown)
  }

  disconnect(): void {
    document.removeEventListener("keydown", this.handleKeydown)
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (!this.hasInputTarget) return
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return

    event.preventDefault()
    this.inputTarget.focus()
    this.inputTarget.select()
  }
}
