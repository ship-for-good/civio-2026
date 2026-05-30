type StepGuideProps = {
  steps: string[];
  tip?: string;
};

export function StepGuide({ steps, tip }: StepGuideProps) {
  return (
    <div>
      <ol className="list-decimal list-inside space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="text-foreground leading-relaxed">
            {step}
          </li>
        ))}
      </ol>
      {tip && (
        <p className="mt-4 text-sm text-foreground-muted">
          💡 {tip}
        </p>
      )}
    </div>
  );
}
