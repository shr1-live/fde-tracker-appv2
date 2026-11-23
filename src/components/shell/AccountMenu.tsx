import { useEffect } from "react";
import { usePopover } from "../../lib/usePopover";
import { Avatar } from "../Avatar";
import { Icon } from "../Icon";
import ThemeSwitch from "../ThemeSwitch";
import { DevPersonaBar } from "../DevPersonaBar";

/** The person's name at the bottom of the side panel; opens their email, the theme switch and Sign out. */
export function AccountMenu({ name, email, isAdmin, onSignOut }: { name: string; email: string; isAdmin: boolean; onSignOut: () => void }) {
  const pop = usePopover();
  useEffect(() => { if (pop.open) pop.box.current?.querySelector<HTMLElement>(".account-pop button")?.focus(); }, [pop.open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="account-wrap" ref={pop.box}>
      {pop.open && (
        <div id="account-pop" className="account-pop pop" role="group" aria-label="Your account">
          <div className="pop-section">
            <p className="overline">Theme</p>
            <ThemeSwitch />
          </div>
          <div className="pop-section dev-only"><DevPersonaBar /></div>
          <div className="pop-foot">
            <button type="button" className="pop-link" onClick={() => { void pop.hide(false); onSignOut(); }}><Icon name="logout" size={16} />Sign out</button>
          </div>
        </div>
      )}
      <button ref={pop.btn} type="button" className="account" aria-expanded={pop.open} aria-controls="account-pop" onClick={pop.toggle} data-tip={name}>
        <Avatar name={name} size="sm" />
        <span className="account-text">
          <span className="account-name">{name}{isAdmin && <span className="badge">Admin</span>}</span>
          <span className="account-mail">{email}</span>
        </span>
        <Icon name="updown" size={16} />
        <span className="sr">. Account, theme and sign out</span>
      </button>
    </div>
  );
}
