"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./Form";

/** Password field with a show/hide toggle. Forwards register() props. */
export default function PasswordInput(props) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <Input type={visible ? "text" : "password"} className="pr-10" spellCheck={false} {...props} />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-muted transition-colors hover:text-royal"
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
            >
                {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
        </div>
    );
}
