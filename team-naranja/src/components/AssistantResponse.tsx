import type { AskResponse } from "@/types";
import { FoundReportCard } from "./FoundReportCard";
import { LinkedSourceCard } from "./LinkedSourceCard";
import { ExternalPortalCard } from "./ExternalPortalCard";
import { RequestWizard } from "./RequestWizard";

interface AssistantResponseProps {
  response: AskResponse;
}

const defaultGuide = {
  steps: [
    "Describe qué información necesitas.",
    "Presenta la solicitud en la Sede Electrónica.",
    "Guarda el número de expediente.",
  ] as [string, string, string],
  template: "Solicitud de acceso a información pública...",
  portalUrl: "https://sede.administracion.gob.es/procedimientos/index/categoria/25",
  organism: "Organismo competente",
};

export function AssistantResponse({ response }: AssistantResponseProps) {
  switch (response.status) {
    case "found":
      return <FoundReportCard response={response} />;
    case "linked":
      return <LinkedSourceCard response={response} />;
    case "external":
      return <ExternalPortalCard response={response} />;
    case "not_found":
      return (
        <RequestWizard
          guide={response.requestGuide ?? defaultGuide}
          reportTitle={response.report.title}
        />
      );
    default:
      return null;
  }
}
