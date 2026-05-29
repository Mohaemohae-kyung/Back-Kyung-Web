import { useEffect, useRef } from 'react';

export default function VulnerableHtml({
  html,
  tag: Tag = 'div',
  className = '',
}) {

  const ref = useRef(null);

  useEffect(() => {

    const root = ref.current;

    if (!root) return;

    const scripts = Array.from(
      root.querySelectorAll('script')
    );

    scripts.forEach(oldScript => {

      const newScript =
        document.createElement('script');

      Array.from(oldScript.attributes)
        .forEach(attr => {

          newScript.setAttribute(
            attr.name,
            attr.value
          );
        });

      newScript.text =
        oldScript.textContent || '';

      oldScript.parentNode?.replaceChild(
        newScript,
        oldScript
      );
    });

  }, [html]);

  return (

    <Tag
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{
        __html: String(html ?? ''),
      }}
    />

  );
}