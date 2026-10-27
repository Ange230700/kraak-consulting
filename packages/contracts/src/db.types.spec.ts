import { describe, expect, it } from 'vitest';

import { Constants } from './db.types';
import { UserRole, PublicationStatus, SupportCategory } from './enums';

describe('Contrats générés de la base de données', () => {
  it('Given les constantes PostgreSQL, When les contrats métier sont comparés, Then les rôles et statuts publics restent compatibles', () => {
    expect(Constants.public.Enums.user_role).toEqual(Object.values(UserRole));
    expect(Constants.public.Enums.publication_status).toEqual(
      Object.values(PublicationStatus),
    );
    expect(Constants.public.Enums.support_category).toEqual(
      Object.values(SupportCategory),
    );
    expect(Constants.graphql_public.Enums).toEqual({});
  });
});
