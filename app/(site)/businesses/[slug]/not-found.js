import NotFoundView from "@/components/NotFoundView";

/* Same failure as any 404, with wording that says which lookup failed. */
export default function BusinessNotFound() {
    return (
        <NotFoundView
            title="Company Not Found"
            description="We could not match that address to a company in the group. Check the link, or browse the full portfolio from the Our Businesses menu."
        />
    );
}
