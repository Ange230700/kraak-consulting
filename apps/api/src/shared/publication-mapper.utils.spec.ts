import { mapPublicationUpdate } from './publication-mapper.utils';

describe('mapPublicationUpdate', () => {
  it('Given tous les champs éditoriaux définis, When la mise à jour est mappée, Then chaque valeur est conservée', () => {
    const payload = {
      slug: 'formation',
      title: 'Formation',
      summary: 'Résumé',
      description: 'Description',
      status: 'published' as const,
    };
    expect(mapPublicationUpdate(payload)).toEqual(payload);
  });

  it('Given des champs absents ou indéfinis, When la mise à jour est mappée, Then aucune valeur indéfinie n’est persistée', () => {
    expect(mapPublicationUpdate({ slug: undefined })).toEqual({});
  });

  it('Given une mise à jour partielle avec un champ spécifique, When les champs communs sont mappés, Then seules les propriétés éditoriales définies sont retenues', () => {
    const payload = { title: '', visibility: 'private' };
    expect(mapPublicationUpdate(payload)).toEqual({ title: '' });
  });
});
