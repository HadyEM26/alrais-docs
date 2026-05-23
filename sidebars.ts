import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Platform',
      items: [
        'platform/overview',
        'platform/architecture',
        'platform/reliability',
      ],
    },
    {
      type: 'category',
      label: 'Connectors',
      link: {type: 'doc', id: 'connectors/index'},
      items: [
        {
          type: 'category',
          label: 'Flights',
          items: [
            'connectors/flights/gds-landscape',
            'connectors/flights/provesio',
            'connectors/flights/duffel',
          ],
        },
        {
          type: 'category',
          label: 'Hotels',
          items: [
            'connectors/hotels/bedbank-landscape',
            'connectors/hotels/ratehawk',
            'connectors/hotels/hotelbeds',
            'connectors/hotels/duffel-stays',
          ],
        },
        {
          type: 'category',
          label: 'Activities & Transfers',
          items: [
            'connectors/activities/activities-landscape',
            'connectors/activities/viator',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Orchestration',
      items: [
        'orchestration/curation-engine',
        'orchestration/package-composition',
        'orchestration/saga-orchestrator',
        'orchestration/failure-isolation',
      ],
    },
    {
      type: 'category',
      label: 'Modules',
      items: [
        'modules/admin-panel-wiring',
        'modules/dynamic-packages-gaps',
        'modules/chatbot-integration',
      ],
    },
    {
      type: 'category',
      label: 'Supplier Portal',
      link: {type: 'doc', id: 'supplier-portal/index'},
      items: [
        'supplier-portal/capability-showcase',
        'supplier-portal/intelligence-api',
        'supplier-portal/platform-analytics',
        'supplier-portal/revenue-analytics',
        'supplier-portal/product-catalog',
        'supplier-portal/reviews',
        'supplier-portal/notifications',
        'supplier-portal/rate-management',
      ],
    },
    {
      type: 'category',
      label: 'Industry Context',
      items: [
        'industry/supplier-models',
        'industry/pricing-models',
        'industry/regional-intelligence',
        'industry/jargon-decoded',
      ],
    },
    'glossary',
  ],
};

export default sidebars;
