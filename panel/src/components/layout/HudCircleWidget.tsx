type HudCircleWidgetProps = { label: string; value: string; detail: string; progress: number };

export default function HudCircleWidget({ label, value, detail, progress }: HudCircleWidgetProps) {
  return (
    <div className="circle-widget">
      <div className="circle-meter" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
        <strong>{value}</strong>
        {label ? <span>{label}</span> : null}
      </div>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}
