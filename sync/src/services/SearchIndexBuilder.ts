import MiniSearch from 'minisearch';
import { SearchIndexDoc, TitleDetail } from '../types.js';

export class SearchIndexBuilder {
  public static build(titles: TitleDetail[]): string {
    const miniSearch = new MiniSearch<SearchIndexDoc>({
      fields: ['title', 'originalTitle', 'faTitle', 'genres'],
      storeFields: ['title', 'originalTitle', 'faTitle', 'year', 'genres', 'type'],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2
      }
    });

    const docs: SearchIndexDoc[] = titles.map((t) => {
      let year = 0;
      if (t.theatricalDate) {
        year = parseInt(t.theatricalDate.substring(0, 4), 10) || 0;
      } else if (t.digitalDate) {
        year = parseInt(t.digitalDate.substring(0, 4), 10) || 0;
      }

      return {
        id: `${t.type}-${t.id}`,
        title: t.title,
        originalTitle: t.originalTitle,
        faTitle: t.translations?.faTitle || t.title,
        year,
        genres: t.genres.map((g) => g.name),
        type: t.type
      };
    });

    miniSearch.addAll(docs);
    return JSON.stringify(miniSearch.toJSON());
  }
}
