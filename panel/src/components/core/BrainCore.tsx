import type { CSSProperties } from "react";
import brainHologram from "../../assets/brain-hologram-clean-v2.png";

const sparks = [
  { left: "39%", top: "31%", dx: "36px", dy: "14px", delay: "0s" },
  { left: "49%", top: "35%", dx: "-28px", dy: "25px", delay: "-0.7s" },
  { left: "58%", top: "39%", dx: "31px", dy: "-18px", delay: "-1.4s" },
  { left: "45%", top: "43%", dx: "42px", dy: "17px", delay: "-2.1s" },
  { left: "54%", top: "47%", dx: "-35px", dy: "-20px", delay: "-2.8s" },
  { left: "62%", top: "44%", dx: "-26px", dy: "29px", delay: "-3.5s" },
] as const;

const electrons = [
  { width: "61%", height: "25%", top: "43%", tilt: "4deg", duration: "5.8s", delay: "-1.1s", tone: "cyan", reverse: false },
  { width: "61%", height: "25%", top: "43%", tilt: "4deg", duration: "5.8s", delay: "-3.9s", tone: "blue", reverse: false },
  { width: "53%", height: "34%", top: "43%", tilt: "58deg", duration: "7.4s", delay: "-2.2s", tone: "violet", reverse: true },
  { width: "53%", height: "34%", top: "43%", tilt: "58deg", duration: "7.4s", delay: "-5.6s", tone: "red", reverse: true },
  { width: "47%", height: "39%", top: "43%", tilt: "116deg", duration: "9.2s", delay: "-4.5s", tone: "cyan", reverse: false },
  { width: "47%", height: "39%", top: "43%", tilt: "116deg", duration: "9.2s", delay: "-7.8s", tone: "blue", reverse: false },
  { width: "39%", height: "43%", top: "43%", tilt: "151deg", duration: "6.8s", delay: "-1.8s", tone: "violet", reverse: true },
  { width: "39%", height: "43%", top: "43%", tilt: "151deg", duration: "6.8s", delay: "-5.1s", tone: "cyan", reverse: true },
] as const;

export default function BrainCore() {
  return (
    <div className="brain-core-visual" aria-hidden="true">
      <div className="brain-core-aura" />
      <img className="brain-core-image" src={brainHologram} alt="" draggable={false} />
      <img className="brain-rings-layer rings-clockwise" src={brainHologram} alt="" draggable={false} />
      <img className="brain-rings-layer rings-counter" src={brainHologram} alt="" draggable={false} />
      <img className="brain-base-rings-layer" src={brainHologram} alt="" draggable={false} />
      <div className="brain-energy-wave wave-one" />
      <div className="brain-energy-wave wave-two" />
      <div className="brain-energy-wave wave-red" />
      <div className="brain-orbit orbit-one"><i /><i /></div>
      <div className="brain-orbit orbit-two"><i /><i /></div>
      <div className="brain-orbit orbit-three"><i /><i /></div>
      {electrons.map((electron, index) => (
        <span
          className={`brain-electron-track ${electron.reverse ? "reverse" : ""}`}
          key={`electron-${index}`}
          style={{
            "--track-width": electron.width,
            "--track-height": electron.height,
            "--track-top": electron.top,
            "--track-tilt": electron.tilt,
            "--track-duration": electron.duration,
            animationDelay: electron.delay,
          } as CSSProperties}
        >
          <i className={`brain-electron ${electron.tone}`} />
        </span>
      ))}
      <div className="brain-core-scan" />
      {sparks.map((spark, index) => (
        <span
          className="brain-core-spark"
          key={index}
          style={{
            left: spark.left,
            top: spark.top,
            animationDelay: spark.delay,
            "--spark-x": spark.dx,
            "--spark-y": spark.dy,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
