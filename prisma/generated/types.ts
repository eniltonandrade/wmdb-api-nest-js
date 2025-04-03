import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const RatingSource = {
    IMDB: "IMDB",
    TMDB: "TMDB",
    ROTTEN_TOMATOES: "ROTTEN_TOMATOES",
    METACRITIC: "METACRITIC"
} as const;
export type RatingSource = (typeof RatingSource)[keyof typeof RatingSource];
export const TokenType = {
    PASSWORD_RECOVER: "PASSWORD_RECOVER"
} as const;
export type TokenType = (typeof TokenType)[keyof typeof TokenType];
export const AccountProvider = {
    GOOGLE: "GOOGLE"
} as const;
export type AccountProvider = (typeof AccountProvider)[keyof typeof AccountProvider];
export const Role = {
    ACTOR: "ACTOR",
    ACTRESS: "ACTRESS",
    DIRECTOR: "DIRECTOR",
    WRITER: "WRITER",
    PRODUCER: "PRODUCER"
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const ListType = {
    WATCHLIST: "WATCHLIST",
    CUSTOM: "CUSTOM"
} as const;
export type ListType = (typeof ListType)[keyof typeof ListType];
export const ListVisibility = {
    PUBLIC: "PUBLIC",
    PRIVATE: "PRIVATE"
} as const;
export type ListVisibility = (typeof ListVisibility)[keyof typeof ListVisibility];
export type Account = {
    id: string;
    provider: AccountProvider;
    provider_account_id: string;
    user_id: string;
};
export type CompaniesOnMovies = {
    movie_id: string;
    company_id: string;
};
export type Company = {
    id: string;
    name: string;
    tmdb_id: number;
    logo_path: string | null;
};
export type Genre = {
    id: string;
    name: string;
    tmdb_id: number;
};
export type GenresOnMovies = {
    movie_id: string;
    genre_id: string;
};
export type History = {
    id: string;
    user_id: string;
    movie_id: string;
    date: Timestamp;
    review: string | null;
    rating: number | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type List = {
    id: string;
    type: ListType;
    name: string;
    description: string | null;
    visibility: ListVisibility;
    user_id: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type Movie = {
    id: string;
    title: string;
    original_title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: Timestamp;
    runtime: number | null;
    imdb_id: string;
    tmdb_id: number;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type MoviesOnLists = {
    id: string;
    movie_id: string;
    list_id: string;
};
export type Person = {
    id: string;
    name: string;
    tmdb_id: number;
    gender: number | null;
    profile_path: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type PersonOnMovies = {
    person_id: string;
    movie_id: string;
    character: string | null;
    order: number | null;
    role: Role;
};
export type RatingsOnMovies = {
    value: number;
    movie_id: string;
    rating_source: RatingSource;
    updated_at: Timestamp | null;
};
export type Tag = {
    id: string;
    name: string;
    user_id: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type TagsOnHistory = {
    historyId: string;
    tagId: string;
};
export type Token = {
    id: string;
    type: TokenType;
    created_at: Generated<Timestamp>;
    user_id: string;
};
export type User = {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    password_hash: string | null;
    avatar_url: string | null;
    preferred_rating: Generated<RatingSource | null>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type DB = {
    accounts: Account;
    companies: Company;
    genres: Genre;
    histories: History;
    list_movies: MoviesOnLists;
    lists: List;
    movie_companies: CompaniesOnMovies;
    movie_genres: GenresOnMovies;
    movie_person: PersonOnMovies;
    movie_ratings: RatingsOnMovies;
    movies: Movie;
    people: Person;
    tags: Tag;
    TagsOnHistory: TagsOnHistory;
    tokens: Token;
    users: User;
};
