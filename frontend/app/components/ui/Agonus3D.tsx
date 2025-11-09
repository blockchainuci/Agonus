'use client';
import React from 'react';

//animated agonus blocks that twist and stack

//letter component
type LetterProps = {
  letter: string;
  count: number;
  reverse?: boolean;
};

const Letter = ({ letter, count, reverse }: LetterProps) => {
  const blocks = Array.from({ length: count }).map((_, i) => {
    const angle = reverse ? -147 * i : 147 * i;
    const sign = i % 2 === 0 ? -1 : 1;
    return (
      <div
        key={i}
        className="block"
        style={
          {
            '--index': i,
            '--angle': angle,
            '--sign': sign,
            gridArea: `a${i + 1}`,
          } as React.CSSProperties
        }
      >
        <span className="face face-1" />
        <span className="face face-2" />
        <span className="face face-3" />
      </div>
    );
  });

  return <div className={`letter ${letter}`}>{blocks}</div>;
};

export default function Agonus3DIntro() {
  return (
    <div className="ready">
      <Letter letter="A" count={12} />
      <Letter letter="G" count={11} reverse />
      <Letter letter="O" count={10} />
      <Letter letter="N" count={12} reverse />
      <Letter letter="U" count={10} />
      <Letter letter="S" count={10} reverse />
    </div>
  );
}
