/**
 * Innovation programmes. Source: innovationData.js (`ventures`).
 */
export default [
    {
        "slug": "second-generation-powertrain",
        "name": "Second-Generation Powertrain",
        "stage": "scaling",
        "sector": "Commercial Mobility",
        "established": "2021",
        "location": "Coventry, United Kingdom",
        "leadEntity": "Warrick Motors",
        "summary": "A commercial drive unit built for regional logistics duty cycles, through durability testing and into production intent for 2027.",
        "coverImage": {
            "url": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=70&w=1600",
            "alt": "",
            "focal": "center"
        },
        "detail": {
            "overview": [
                "The programme replaces a first-generation unit whose testing ended early in 2021 on cold-start and sustained-gradient cases. Both failure modes were published at the time, and both were treated as scope conditions for the successor rather than as edge cases to be designed around later.",
                "Scope has stayed on regional logistics throughout. Long-haul was considered twice and declined twice: the duty cycle is different enough that serving both would have compromised the thermal design for the segment the group actually operates in.",
                "Durability testing completed in April 2026 and surfaced one thermal management issue at sustained load, addressed in the current build. The engineering summary carries the failure case, on the view that a durability programme reporting no failures was not testing hard enough.",
                "Production intent is unchanged for 2027. The unit will be offered to third-party fleet operators through the electrification programme rather than sold as a standalone component."
            ],
            "milestones": [
                {
                    "label": "Duty Cycles Completed",
                    "value": "2,400"
                },
                {
                    "label": "Units in Field Trial",
                    "value": "38"
                },
                {
                    "label": "Production Intent",
                    "value": "2027"
                }
            ],
            "partners": [
                "Coventry engineering campus",
                "Two regional logistics operators under NDA",
                "An independent vehicle testing authority"
            ]
        },
        "order": 0
    },
    {
        "slug": "returns-triage-grading",
        "name": "Returns Triage and Grading",
        "stage": "scaling",
        "sector": "Commerce Infrastructure",
        "established": "2019",
        "location": "Rotterdam, Netherlands",
        "leadEntity": "Clara",
        "summary": "Automated grading that decides whether a returned unit is refurbished, parted out or written off, now being extended to third-party hardware.",
        "coverImage": {
            "url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=70&w=1600",
            "alt": "",
            "focal": "center"
        },
        "detail": {
            "overview": [
                "Returns handling was built for Clara's own hardware, where a returned unit is triaged, graded and routed rather than written off on arrival. The grading step is the part that carries the value, and it is almost entirely a software problem sitting on top of a fairly ordinary conveyor.",
                "The programme is now being extended to third-party hardware as part of the platform cohort. Very little of the process changes: the grading model is trained per product family, and a new family reaches useful accuracy inside about six weeks of returns volume.",
                "Write-off rate is the metric the programme is judged on. It has fallen by roughly two-thirds since 2019 and is now flat, which the team reads as the process having reached the limit of what triage alone can recover."
            ],
            "milestones": [
                {
                    "label": "Write-Off Rate vs 2019",
                    "value": "-64%"
                },
                {
                    "label": "Units Graded Daily",
                    "value": "11,000"
                },
                {
                    "label": "Product Families Live",
                    "value": "27"
                }
            ],
            "partners": [
                "Clara fulfilment network",
                "Two cohort hardware brands"
            ]
        },
        "order": 1
    },
    {
        "slug": "depot-charging-assessment",
        "name": "Depot Charging Assessment",
        "stage": "pilot",
        "sector": "Mobility Infrastructure",
        "established": "2023",
        "location": "Coventry, United Kingdom",
        "leadEntity": "Warrick Motors",
        "summary": "A survey method that sizes depot charging from observed duty cycles rather than from stated range requirements, which operators consistently overestimate.",
        "coverImage": {
            "url": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=70&w=1600",
            "alt": "",
            "focal": "center"
        },
        "detail": {
            "overview": [
                "Every conversion engagement begins with a duty cycle survey rather than a vehicle order. The programme exists because operators overestimate their range requirement by a wide margin, and the resulting oversizing is the single largest avoidable cost in a fleet conversion.",
                "The survey runs telematics against depot dwell time for a full operating month. In roughly four cases out of five it returns a smaller charging installation than the operator had budgeted for, and in the fifth it finds a depot that cannot support the fleet at all, which is worth knowing before the vehicles arrive.",
                "The methodology will be published alongside the commercial launch of the third-party programme. A conversion built on an unpublished method is difficult for an operator to audit, and an operator who cannot audit the assumptions cannot defend the capital request internally."
            ],
            "milestones": [
                {
                    "label": "Depots Surveyed",
                    "value": "62"
                },
                {
                    "label": "Median Oversizing Found",
                    "value": "41%"
                },
                {
                    "label": "Methodology Published",
                    "value": "Q4 2026"
                }
            ],
            "partners": [
                "Regional logistics operators in the UK and Ireland"
            ]
        },
        "order": 2
    },
    {
        "slug": "materials-recovery-line",
        "name": "Materials Recovery Line",
        "stage": "pilot",
        "sector": "Circularity",
        "established": "2024",
        "location": "Halden, Norway",
        "leadEntity": "Group Shared",
        "summary": "A shared recovery route for cells, motors and enclosures across the vehicle and hardware programmes, which neither company could justify alone.",
        "coverImage": {
            "url": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=70&w=1600",
            "alt": "",
            "focal": "center"
        },
        "detail": {
            "overview": [
                "Recovery is shared between Warrick Motors and Clara because neither has the volume to justify a line on its own. That is the whole argument for running it at group level, and it is the clearest example of what the parent balance sheet is actually for.",
                "The line currently handles cells and motors. Enclosures were deferred: the mixed-polymer housings on the older hardware generations recover poorly enough that the energy cost outweighs the material recovered, and the design change that fixes it only reaches the field in 2027.",
                "Output feeds back into both programmes as qualified secondary material rather than being sold on. Qualification is the slow part and is handled by the materials team rather than by the line operator."
            ],
            "milestones": [
                {
                    "label": "Cell Material Recovered",
                    "value": "78%"
                },
                {
                    "label": "Annual Line Capacity",
                    "value": "2,600 t"
                },
                {
                    "label": "Requalified Into Production",
                    "value": "31%"
                }
            ],
            "partners": [
                "Halden site operations",
                "An external materials qualification lab"
            ]
        },
        "order": 3
    },
    {
        "slug": "long-duration-storage-trial",
        "name": "Long-Duration Storage Trial",
        "stage": "research",
        "sector": "Energy Systems",
        "established": "2025",
        "location": "Halden, Norway",
        "leadEntity": "Warrick Corporation",
        "summary": "Multi-day storage tested against the group's own generation base, where a poor result costs availability rather than a customer.",
        "coverImage": {
            "url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=70&w=1600",
            "alt": "",
            "focal": "center"
        },
        "detail": {
            "overview": [
                "Long-duration storage is the constraint on the group's 2029 generation commitment, and it is the one part of the roadmap with no proven route. The trial exists to find out how far the available chemistries actually get, not to validate a decision already taken.",
                "It runs against the group's own generation, deliberately. A failed cycle costs the group availability on its own asset rather than costing a customer their supply, which is the only setting where testing this honestly is possible.",
                "No procurement decision follows automatically from the trial. The investment committee has said in advance that a negative result is a usable result, and that the fallback is a longer thermal tail rather than an unproven installation."
            ],
            "milestones": [
                {
                    "label": "Discharge Duration Achieved",
                    "value": "62 h"
                },
                {
                    "label": "Round-Trip Efficiency",
                    "value": "71%"
                },
                {
                    "label": "Committee Review",
                    "value": "2027"
                }
            ],
            "partners": [
                "Halden generation site",
                "A European grid research institute"
            ]
        },
        "order": 4
    },
    {
        "slug": "site-balancing-control",
        "name": "Site Balancing Control",
        "stage": "research",
        "sector": "Energy Systems",
        "established": "2025",
        "location": "London, United Kingdom",
        "leadEntity": "Warrick Corporation",
        "summary": "Control software that dispatches generation, storage and site load as one system instead of three independently optimised ones.",
        "coverImage": {
            "url": "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&q=70&w=1600",
            "alt": "",
            "focal": "center"
        },
        "detail": {
            "overview": [
                "Generation, storage and site load are currently optimised separately at every site in the group. Each does its own job well and the combination leaves a measurable amount of availability on the floor, which is the gap this programme is aimed at.",
                "The work is software rather than hardware, which makes it unusually cheap to trial and unusually easy to oversell. The team reports against measured site availability only, and explicitly not against modelled savings.",
                "Two sites are instrumented. A third will be added once the control layer has run a full winter without human intervention, which it has not yet done."
            ],
            "milestones": [
                {
                    "label": "Availability Gain, Site One",
                    "value": "+2.4%"
                },
                {
                    "label": "Sites Instrumented",
                    "value": "02"
                },
                {
                    "label": "Longest Unattended Run",
                    "value": "94 d"
                }
            ],
            "partners": [
                "Halden Energy",
                "An academic control systems group"
            ]
        },
        "order": 5
    }
];
