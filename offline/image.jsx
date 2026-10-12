/* eslint-disable @next/next/no-img-element */
export default function Image({
  src,
  alt,
  fill,
  priority,
  unoptimized,
  quality,
  sizes,
  style,
  ...props
}) {
  void priority;
  void unoptimized;
  void quality;
  void sizes;
  return (
    <img
      {...props}
      alt={alt}
      src={window.portalAssets[src] || src}
      style={
        fill
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              ...style,
            }
          : style
      }
    />
  );
}
