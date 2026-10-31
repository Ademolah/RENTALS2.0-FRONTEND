import { FIELD_THEMES, joinClass } from './themes';

// A label with its control (input, select or textarea) styled by a theme.
// `extra` adds classes after the theme's; `controlClassName` / `labelClassName` replace them entirely;
// `after` renders extra content below the control inside the same wrapper.
export function Field({
  theme, label, labelNode, labelClassName, labelExtra, as: Tag = 'input', wrapperClass, extra, controlClassName, after, ...control
}) {
  const t = FIELD_THEMES[theme];
  const base = Tag === 'textarea' && t.textarea ? t.textarea : t.control;
  return (
    <div className={wrapperClass}>
      {(label != null || labelNode) && (
        <label className={labelClassName ?? joinClass(t.label, labelExtra)}>{labelNode ?? label}</label>
      )}
      <Tag className={controlClassName ?? joinClass(base, extra)} {...control} />
      {after}
    </div>
  );
}

export const SelectField = (props) => <Field as="select" {...props} />;
export const TextAreaField = (props) => <Field as="textarea" {...props} />;
