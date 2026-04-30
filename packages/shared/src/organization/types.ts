export interface OrganizationTypeFlags {
  isShipper: boolean;
  isConsignee: boolean;
  isAgent: boolean;
}

export interface OrganizationSummary extends OrganizationTypeFlags {
  id: string;
  name: string;
  code: string | null;
  cwCode: string | null;
  origin: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  city: string | null;
  postal: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationPayload extends OrganizationTypeFlags {
  name: string;
  code: string | null;
  cwCode: string | null;
  origin: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  address4: string | null;
  city: string | null;
  postal: string | null;
  country: string | null;
}

export interface OrganizationRelationshipPayload {
  organizationId: string;
  label: string | null;
}

export interface OrganizationListFilters {
  isShipper?: boolean;
  isConsignee?: boolean;
  isAgent?: boolean;
}

export interface OrganizationRelationshipSummary {
  id: string;
  label: string | null;
  relatedOrganization: OrganizationSummary;
}
