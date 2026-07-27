export type PublicListingDto = {
  publicId: string;
  title: string;
  suburb: string;
  city: string;
  category: string;
  price?: number;
};

type RawRecord = Record<string, unknown>;

const PUBLIC_FIELDS: readonly (keyof PublicListingDto)[] = [
  "publicId",
  "title",
  "suburb",
  "city",
  "category",
  "price",
];

export function toPublicListingDto(record: RawRecord): PublicListingDto {
  const dto = {} as PublicListingDto;
  for (const field of PUBLIC_FIELDS) {
    if (record[field] !== undefined) {
      (dto[field] as unknown) = record[field];
    }
  }
  return dto;
}

export function sanitiseList(records: RawRecord[]): PublicListingDto[] {
  return records.map(toPublicListingDto);
}
