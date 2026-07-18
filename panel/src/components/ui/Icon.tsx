type IconProps = { name: string; className?: string };

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const paths: Record<string, React.ReactNode> = {
  core: <><path {...S} d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Z" /><circle {...S} cx="12" cy="12" r="3" /></>,
  memory: <><ellipse {...S} cx="12" cy="6" rx="7" ry="2.6" /><path {...S} d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" /><path {...S} d="M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6" /></>,
  cpu: <><rect {...S} x="6.5" y="6.5" width="11" height="11" rx="1.5" /><rect {...S} x="9.5" y="9.5" width="5" height="5" rx="1" /><path {...S} d="M9 6.5V4M15 6.5V4M9 17.5V20M15 17.5V20M6.5 9H4M6.5 15H4M17.5 9H20M17.5 15H20" /></>,
  network: <><path {...S} d="M4 9.5a12 12 0 0 1 16 0" /><path {...S} d="M7 13a7.5 7.5 0 0 1 10 0" /><path {...S} d="M9.7 16.2a3.5 3.5 0 0 1 4.6 0" /><circle cx="12" cy="19" r="1.1" fill="currentColor" /></>,
  aiengine: <><path {...S} d="M8 5.5A3.5 3.5 0 0 0 5.5 11 3.2 3.2 0 0 0 6 16.5 3 3 0 0 0 9 19h1.5V5.5H9a1 1 0 0 0-1 0Z" /><path {...S} d="M16 5.5A3.5 3.5 0 0 1 18.5 11a3.2 3.2 0 0 1-.5 5.5A3 3 0 0 1 15 19h-1.5V5.5H15a1 1 0 0 1 1 0Z" /><path {...S} d="M12 5.5v13.5" /></>,
  globe: <><circle {...S} cx="12" cy="12" r="8" /><path {...S} d="M4 12h16M12 4c2.5 2.2 2.5 13.8 0 16M12 4c-2.5 2.2-2.5 13.8 0 16" /></>,
  brain: <><path {...S} d="M9.5 6A2.8 2.8 0 0 0 7 9.4 2.6 2.6 0 0 0 7 14a2.7 2.7 0 0 0 2.5 3.5" /><path {...S} d="M14.5 6A2.8 2.8 0 0 1 17 9.4a2.6 2.6 0 0 1 0 4.6 2.7 2.7 0 0 1-2.5 3.5" /><path {...S} d="M9.5 6a2.5 2.5 0 0 1 5 0M9.5 17.5a2.5 2.5 0 0 0 5 0M12 6.5v11" /></>,
  processing: <><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 3" /><circle {...S} cx="12" cy="12" r="3" /></>,
  shield: <><path {...S} d="M12 3 5 6v5c0 4.4 3 8 7 10 4-2 7-5.6 7-10V6l-7-3Z" /><path {...S} d="m9 12 2 2 4-4.5" /></>,
  mic: <><rect {...S} x="9" y="3" width="6" height="11" rx="3" /><path {...S} d="M6 11a6 6 0 0 0 12 0" /><path {...S} d="M12 17v3" /></>,
  email: <><rect {...S} x="3.5" y="5.5" width="17" height="13" rx="2" /><path {...S} d="m4 7 8 6 8-6" /></>,
  tasks: <><path {...S} d="M9 6h11M9 12h11M9 18h11" /><path {...S} d="m3.5 6 1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17" /></>,
  settings: <><circle {...S} cx="12" cy="12" r="3" /><path {...S} d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" /></>,
  send: <><path {...S} d="M4 12 20 4l-6 16-3.5-6.5L4 12Z" /></>,
  pulse: <><path {...S} d="M3 12h4l2.5-6 4 12 2.5-6H21" /></>,
  min: <path {...S} d="M6 12h12" />,
  max: <rect {...S} x="6" y="6" width="12" height="12" rx="1" />,
  close: <path {...S} d="M7 7l10 10M17 7 7 17" />,
  kernel: <><path {...S} d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" /><path {...S} d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  uptime: <><circle {...S} cx="12" cy="12" r="8" /><path {...S} d="M12 7.5V12l3 2" /></>,
  connection: <><path {...S} d="M12 3 5 6v5c0 4.4 3 8 7 10 4-2 7-5.6 7-10V6l-7-3Z" /><circle cx="12" cy="11.5" r="1.4" fill="currentColor" /><path {...S} d="M12 12.9V16" /></>,
  dataflow: <><path {...S} d="M4 9h11l-3-3M20 15H9l3 3" /></>,
};

export default function Icon({ name, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  );
}
