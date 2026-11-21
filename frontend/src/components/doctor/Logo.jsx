import { cn } from "../../utils/cn";

import "./Logo.css";

/**
 * CareCompass logo mark.
 *
 * A stethoscope whose tubing draws a compass dial around a compass
 * star — "care" + "compass" in one symbol (official brand artwork).
 * Delivered as a transparent PNG cut from the original vector-style
 * artwork; `variant="light"` is a white silhouette for dark surfaces.
 */
export function LogoMark({
  className,
  size = 24,
  variant = "default",
}) {
  const height = size;
  const width = Math.round(size * (1000 / 1084) * 100) / 100;

  return (
    <img
      src={
        variant === "light"
          ? "/assets/carecompass-logo-light.png"
          : "/assets/carecompass-logo.png"
      }
      alt="CareCompass logo"
      width={width}
      height={height}
      draggable={false}
      className={cn("lg-mark", className)}
      style={{ height, width: "auto" }}
    />
  );
}

/**
 * Full lockup: logo mark + "CareCompass" wordmark (Fraunces serif).
 */
export function Logo({
  className,
  size = 32,
  showWordmark = true,
  variant = "default",
  wordmarkClassName,
}) {
  return (
    <span className={cn("lg-lockup", className)}>
      <LogoMark size={size} variant={variant} />
      {showWordmark && (
        <span
          className={cn(
            "lg-wordmark",
            variant === "light" ? "lg-wordmark-light" : "lg-wordmark-dark",
            wordmarkClassName
          )}
        >
          Care<span className="lg-wordmark-primary">Compass</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
