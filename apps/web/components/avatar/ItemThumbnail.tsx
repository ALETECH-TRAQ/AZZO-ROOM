import {
  clothingColors,
  hairColors,
  skins,
  type AvatarConfig,
} from "@/lib/avatars";
export default function ItemThumbnail({
  category,
  index,
  config,
}: {
  category: string;
  index: number;
  config: AvatarConfig;
}) {
  const skin = skins[config.skin],
    hair = hairColors[config.hairColor],
    cloth = clothingColors[config.topColor];
  if (category === "top" || category === "bottom" || category === "shoes")
    return (
      <svg aria-hidden viewBox="0 0 80 60" width="60" height="47">
        <defs>
          <linearGradient id={`cloth-${category}-${index}`}>
            <stop stopColor={cloth} />
            <stop offset="1" stopColor="#426083" />
          </linearGradient>
        </defs>
        {category === "top" ? (
          <>
            <path
              d={
                index === 2
                  ? "M25 10 12 20 20 31 26 27 26 54 54 54 54 27 60 31 68 20 55 10 47 7 33 7Z"
                  : "M25 10 17 17 11 46 22 49 28 25 26 54 54 54 52 25 58 49 69 46 63 17 55 10 47 7 33 7Z"
              }
              fill={`url(#cloth-${category}-${index})`}
              stroke="#adc9e2"
              strokeWidth=".6"
            />
            <path d="m33 7 7 9 7-9-7 3Z" fill="#f1eee5" />
            {index === 1 || index === 4 ? (
              <>
                <path d="m33 9 7 8 7-8-4 19-3 24-3-24Z" fill="#f2efe8" />
                <path d="m40 17 3 3-3 15-3-15Z" fill="#2b4b77" />
              </>
            ) : (
              <path d="M40 17v35" stroke="#90adc6" />
            )}
          </>
        ) : category === "bottom" ? (
          <path
            d={
              index === 0
                ? "M25 8h30l2 46H44l-4-28-4 28H23Z"
                : "M27 8h26l10 46H17Z"
            }
            fill="#536582"
            stroke="#8fa5c0"
          />
        ) : (
          <>
            <path
              d={
                index === 0
                  ? "m18 30 13-2 4 13 9 3v8H12V41Z"
                  : "m18 30 13-2 4 13 9 3v8H12V41Z"
              }
              fill={index === 0 ? "#364257" : "#e6eaf1"}
            />
            <path d="M12 49h32" stroke="#89b3d7" strokeWidth="3" />
          </>
        )}
      </svg>
    );
  return (
    <svg aria-hidden viewBox="0 0 80 65" width="66" height="54">
      {category === "hair" && index >= 7 && index <= 10 && (
        <path
          d={`M17 25 Q9 50 17 ${index === 8 ? 54 : 62}h46Q72 50 63 25Z`}
          fill={hair}
        />
      )}
      <ellipse cx="40" cy="34" rx="23" ry="25" fill={skin} />
      <ellipse cx="31" cy="36" rx="3" ry="4" fill="#243047" />
      <ellipse cx="49" cy="36" rx="3" ry="4" fill="#243047" />
      <path d="M36 48q4 3 8 0" fill="none" stroke="#a77968" strokeWidth="1.5" />
      {category === "hair" && (
        <>
          {index === 5 ? (
            <path d="M17 28Q12 1 40 5q28-1 23 23L55 19H25Z" fill={hair} />
          ) : (
            <path
              d={
                index === 1 || index === 6
                  ? "M17 32Q9 10 28 8Q55-7 65 17L50 27 53 15Q41 35 24 26L20 36Z"
                  : index === 11
                    ? "M17 30Q12 4 40 7q29-2 23 23L51 18Q40 31 26 20Z"
                    : "M17 31Q6 17 22 9Q28-1 41 7Q55-1 61 12Q74 23 59 32L51 18Q38 36 25 24L19 37Z"
              }
              fill={hair}
            />
          )}{" "}
          {index === 11 && <circle cx="40" cy="8" r="9" fill={hair} />}{" "}
          {(index === 4 || index === 10) &&
            [0, 1, 2, 3, 4, 5].map((i) => (
              <circle
                key={i}
                cx={16 + i * 9}
                cy={14 + Math.sin(i) * 4}
                r="8"
                fill={hair}
              />
            ))}
          {index === 12 && (
            <ellipse cx="61" cy="30" rx="8" ry="15" fill={hair} />
          )}
        </>
      )}
      {category === "glasses" && (
        <>
          <path
            d="M18 22Q17 2 40 7q23-3 24 16L53 18Q35 30 25 19Z"
            fill={hair}
          />
          {index > 0 && (
            <g
              fill="none"
              stroke={index === 4 ? "#d9bf8e" : "#25354d"}
              strokeWidth="2.2"
            >
              {index === 1 || index === 4 ? (
                <>
                  <ellipse cx="28" cy="36" rx="9" ry={index === 4 ? 7 : 9} />
                  <ellipse cx="52" cy="36" rx="9" ry={index === 4 ? 7 : 9} />
                </>
              ) : (
                <>
                  <rect
                    x="19"
                    y="29"
                    width="19"
                    height={index === 3 ? 12 : 17}
                    rx={index === 2 ? 2 : 5}
                  />
                  <rect
                    x="43"
                    y="29"
                    width="19"
                    height={index === 3 ? 12 : 17}
                    rx={index === 2 ? 2 : 5}
                  />
                </>
              )}
              <path d="M37 35h6M17 32l-3-2m49 2 3-2" />
            </g>
          )}
        </>
      )}
    </svg>
  );
}
