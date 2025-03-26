import { relations, sql } from 'drizzle-orm'
import {
  datetime,
  double,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  unique,
  varchar,
} from 'drizzle-orm/mysql-core'
import { v4 as uuidv4 } from 'uuid'

export const tagsOnHistory = mysqlTable(
  'TagsOnHistory',
  {
    historyId: varchar({ length: 191 })
      .notNull()
      .references(() => histories.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    tagId: varchar({ length: 191 })
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.historyId, table.tagId],
      name: 'TagsOnHistory_historyId_tagId',
    }),
  ],
)

export const accounts = mysqlTable(
  'accounts',
  {
    id: varchar({ length: 191 }).notNull(),
    provider: mysqlEnum(['GOOGLE']).notNull(),
    providerAccountId: varchar('provider_account_id', {
      length: 191,
    }).notNull(),
    userId: varchar('user_id', { length: 191 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'accounts_id' }),
    unique('accounts_provider_account_id_key').on(table.providerAccountId),
    unique('accounts_provider_user_id_key').on(table.provider, table.userId),
  ],
)

export const companies = mysqlTable(
  'companies',
  {
    id: varchar({ length: 191 }).notNull(),
    name: varchar({ length: 191 }).notNull(),
    tmdbId: int().notNull(),
    logoPath: varchar('logo_path', { length: 191 }),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'companies_id' }),
    unique('companies_tmdbId_key').on(table.tmdbId),
  ],
)

export const genres = mysqlTable(
  'genres',
  {
    id: varchar({ length: 191 })
      .notNull()
      .$defaultFn(() => uuidv4()),
    name: varchar({ length: 191 }).notNull(),
    tmdbId: int().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'genres_id' }),
    unique('genres_tmdbId_key').on(table.tmdbId),
  ],
)

export const histories = mysqlTable(
  'histories',
  {
    id: varchar({ length: 191 }).notNull(),
    userId: varchar('user_id', { length: 191 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    movieId: varchar('movie_id', { length: 191 })
      .notNull()
      .references(() => movies.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    date: datetime({ mode: 'string', fsp: 3 }).notNull(),
    review: varchar({ length: 191 }),
    rating: double(),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'string', fsp: 3 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'histories_id' }),
    unique('histories_movie_id_user_id_key').on(table.movieId, table.userId),
  ],
)

export const listMovies = mysqlTable(
  'list_movies',
  {
    id: varchar({ length: 191 }).notNull(),
    movieId: varchar('movie_id', { length: 191 })
      .notNull()
      .references(() => movies.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    listId: varchar('list_id', { length: 191 })
      .notNull()
      .references(() => lists.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'list_movies_id' }),
    unique('list_movies_list_id_movie_id_key').on(table.listId, table.movieId),
  ],
)

export const lists = mysqlTable(
  'lists',
  {
    id: varchar({ length: 191 }).notNull(),
    type: mysqlEnum(['WATCHLIST', 'CUSTOM']).notNull(),
    name: varchar({ length: 191 }).notNull(),
    description: varchar({ length: 191 }),
    visibility: mysqlEnum(['PUBLIC', 'PRIVATE']).notNull(),
    userId: varchar('user_id', { length: 191 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'string', fsp: 3 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'lists_id' })],
)

export const movieCast = mysqlTable(
  'movie_cast',
  {
    personId: varchar('person_id', { length: 191 })
      .notNull()
      .references(() => people.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    movieId: varchar('movie_id', { length: 191 })
      .notNull()
      .references(() => movies.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    character: varchar({ length: 191 }).notNull(),
    order: int().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.personId, table.movieId],
      name: 'movie_cast_person_id_movie_id',
    }),
    unique('movie_cast_person_id_movie_id_key').on(
      table.personId,
      table.movieId,
    ),
  ],
)

export const moviePeople = mysqlTable(
  'movie_person',
  {
    personId: varchar('person_id', { length: 191 })
      .notNull()
      .references(() => people.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    movieId: varchar('movie_id', { length: 191 })
      .notNull()
      .references(() => movies.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    character: varchar({ length: 191 }),
    order: int(),
    role: mysqlEnum(['CAST', 'DIRECTOR', 'WRITER', 'PRODUCER']).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.personId, table.movieId, table.role],
      name: 'movie_person_id_movie_id_role',
    }),
    unique('movie_person_id_movie_id_key').on(
      table.personId,
      table.movieId,
      table.role,
    ),
  ],
)

export const movieCompanies = mysqlTable(
  'movie_companies',
  {
    movieId: varchar('movie_id', { length: 191 })
      .notNull()
      .references(() => movies.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    companyId: varchar('company_id', { length: 191 })
      .notNull()
      .references(() => companies.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.companyId, table.movieId],
      name: 'movie_companies_company_id_movie_id',
    }),
    unique('movie_companies_company_id_movie_id_key').on(
      table.companyId,
      table.movieId,
    ),
  ],
)

export const movieCrew = mysqlTable(
  'movie_crew',
  {
    personId: varchar('person_id', { length: 191 })
      .notNull()
      .references(() => people.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    movieId: varchar('movie_id', { length: 191 })
      .notNull()
      .references(() => movies.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    job: varchar({ length: 191 }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.personId, table.movieId, table.job],
      name: 'movie_crew_person_id_movie_id_job',
    }),
    unique('movie_crew_person_id_movie_id_job_key').on(
      table.personId,
      table.movieId,
      table.job,
    ),
  ],
)

export const movieGenres = mysqlTable(
  'movie_genres',
  {
    movieId: varchar('movie_id', { length: 191 })
      .notNull()
      .references(() => movies.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    genreId: varchar('genre_id', { length: 191 })
      .notNull()
      .references(() => genres.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.genreId, table.movieId],
      name: 'movie_genres_genre_id_movie_id',
    }),
    unique('movie_genres_genre_id_movie_id_key').on(
      table.genreId,
      table.movieId,
    ),
  ],
)

export const movieRatings = mysqlTable(
  'movie_ratings',
  {
    score: double().notNull(),
    movieId: varchar('movie_id', { length: 191 })
      .notNull()
      .references(() => movies.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    ratingSource: mysqlEnum('rating_source', [
      'IMDB',
      'TMDB',
      'ROTTEN_TOMATOES',
      'METACRITIC',
    ]),
    updatedAt: datetime('updated_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    unique('movie_ratings_rating_source_id_movie_id_key').on(
      table.ratingSource,
      table.movieId,
    ),
  ],
)

export const movies = mysqlTable(
  'movies',
  {
    id: varchar({ length: 191 })
      .notNull()
      .$defaultFn(() => uuidv4()),
    title: varchar({ length: 191 }).notNull(),
    originalTitle: varchar('original_title', { length: 191 }).notNull(),
    posterPath: varchar('poster_path', { length: 191 }),
    backdropPath: varchar('backdrop_path', { length: 191 }),
    releaseDate: datetime('release_date', { mode: 'string', fsp: 3 }).notNull(),
    runtime: int(),
    imdbId: varchar('imdb_id', { length: 191 }).notNull(),
    tmdbId: int('tmdb_id').notNull(),
    imdbRating: double('imdb_rating'),
    tmdbRating: double('tmdb_rating'),
    metacriticRating: double('metacritic_rating'),
    rottenTomatoesRating: double('rotten_tomatoes_rating'),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    updatedAt: datetime('updated_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'movies_id' }),
    unique('movies_imdb_id_key').on(table.imdbId),
    unique('movies_tmdb_id_key').on(table.tmdbId),
  ],
)

export const people = mysqlTable(
  'people',
  {
    id: varchar({ length: 191 }).notNull(),
    name: varchar({ length: 191 }).notNull(),
    tmdbId: int().notNull(),
    gender: int(),
    profilePath: varchar('profile_path', { length: 191 }),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'string', fsp: 3 }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'people_id' }),
    unique('people_tmdbId_key').on(table.tmdbId),
  ],
)

export const tags = mysqlTable(
  'tags',
  {
    id: varchar({ length: 191 }).notNull(),
    name: varchar({ length: 191 }).notNull(),
    userId: varchar('user_id', { length: 191 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    updatedAt: datetime('updated_at', { mode: 'string', fsp: 3 }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'tags_id' })],
)

export const tokens = mysqlTable(
  'tokens',
  {
    id: varchar({ length: 191 }).notNull(),
    type: mysqlEnum(['PASSWORD_RECOVER']).notNull(),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .notNull(),
    userId: varchar('user_id', { length: 191 })
      .notNull()
      .references(() => users.id, {
        onDelete: 'restrict',
        onUpdate: 'cascade',
      }),
  },
  (table) => [primaryKey({ columns: [table.id], name: 'tokens_id' })],
)

export const users = mysqlTable(
  'users',
  {
    id: varchar({ length: 191 }).$defaultFn(() => uuidv4()),
    name: varchar({ length: 191 }),
    username: varchar({ length: 191 }),
    email: varchar({ length: 191 }).notNull(),
    passwordHash: varchar('password_hash', { length: 191 }),
    avatarUrl: varchar('avatar_url', { length: 191 }),
    preferredRating: varchar('preferred_rating', { length: 191 }),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
    updatedAt: datetime('updated_at', { mode: 'string', fsp: 3 })
      .default(sql`(CURRENT_TIMESTAMP(3))`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'users_id' }),
    unique('users_email_key').on(table.email),
  ],
)

// relations

export const tagsOnHistoryRelations = relations(tagsOnHistory, ({ one }) => ({
  history: one(histories, {
    fields: [tagsOnHistory.historyId],
    references: [histories.id],
  }),
  tag: one(tags, {
    fields: [tagsOnHistory.tagId],
    references: [tags.id],
  }),
}))

export const historiesRelations = relations(histories, ({ one, many }) => ({
  tagsOnHistories: many(tagsOnHistory),
  movie: one(movies, {
    fields: [histories.movieId],
    references: [movies.id],
  }),
  user: one(users, {
    fields: [histories.userId],
    references: [users.id],
  }),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
  tagsOnHistories: many(tagsOnHistory),
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  histories: many(histories),
  lists: many(lists),
  tags: many(tags),
  tokens: many(tokens),
}))

export const moviesRelations = relations(movies, ({ many }) => ({
  histories: many(histories),
  listMovies: many(listMovies),
  movieCasts: many(movieCast),
  movieCompanies: many(movieCompanies),
  movieCrews: many(movieCrew),
  movieGenres: many(movieGenres),
  movieRatings: many(movieRatings),
  moviePeople: many(moviePeople),
}))

export const listMoviesRelations = relations(listMovies, ({ one }) => ({
  list: one(lists, {
    fields: [listMovies.listId],
    references: [lists.id],
  }),
  movie: one(movies, {
    fields: [listMovies.movieId],
    references: [movies.id],
  }),
}))

export const listsRelations = relations(lists, ({ one, many }) => ({
  listMovies: many(listMovies),
  user: one(users, {
    fields: [lists.userId],
    references: [users.id],
  }),
}))

export const movieCastRelations = relations(movieCast, ({ one }) => ({
  movie: one(movies, {
    fields: [movieCast.movieId],
    references: [movies.id],
  }),
  person: one(people, {
    fields: [movieCast.personId],
    references: [people.id],
  }),
}))

export const moviePeopleRelations = relations(moviePeople, ({ one }) => ({
  movie: one(movies, {
    fields: [moviePeople.movieId],
    references: [movies.id],
  }),
  person: one(people, {
    fields: [moviePeople.personId],
    references: [people.id],
  }),
}))

export const peopleRelations = relations(people, ({ many }) => ({
  movieCasts: many(movieCast),
  movieCrews: many(movieCrew),
}))

export const movieCompaniesRelations = relations(movieCompanies, ({ one }) => ({
  company: one(companies, {
    fields: [movieCompanies.companyId],
    references: [companies.id],
  }),
  movie: one(movies, {
    fields: [movieCompanies.movieId],
    references: [movies.id],
  }),
}))

export const companiesRelations = relations(companies, ({ many }) => ({
  movieCompanies: many(movieCompanies),
}))

export const movieCrewRelations = relations(movieCrew, ({ one }) => ({
  movie: one(movies, {
    fields: [movieCrew.movieId],
    references: [movies.id],
  }),
  person: one(people, {
    fields: [movieCrew.personId],
    references: [people.id],
  }),
}))

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
}))

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}))

export const tokensRelations = relations(tokens, ({ one }) => ({
  user: one(users, {
    fields: [tokens.userId],
    references: [users.id],
  }),
}))
